"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscrowManager = void 0;
// services/escrow.service.ts
const mongoose_1 = __importDefault(require("mongoose"));
const accounts_model_1 = __importDefault(require("../../../models/accounts.model"));
const orders_model_1 = require("../../../models/orders.model");
const deposits_model_1 = __importDefault(require("../../../models/deposits.model"));
const tokens_config_1 = require("../../../escrow/config/tokens.config");
const depositIntent_model_1 = require("../../../models/depositIntent.model");
const uuid_1 = require("uuid");
const cryptolisting_service_1 = require("../listingsServices/cryptolisting.service");
const transactions_decorator_1 = require("../../../decorators/transactions.decorator");
const saleListing_model_1 = __importDefault(require("../../../models/saleListing.model"));
const escrow_model_1 = __importDefault(require("../../../models/escrow.model"));
const escrow_balance_queue_1 = require("../../../escrow/queues/escrow-balance-queue");
class EscrowManager {
    static initiateDeposit(accountId, amount, currency) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                const user = yield accounts_model_1.default.findById(accountId);
                if (!user)
                    throw new Error("User not found");
                const payload = {
                    amount,
                    currency,
                    accountId: new mongoose_1.default.Schema.Types.ObjectId(accountId),
                };
                yield deposits_model_1.default.create([payload], { session });
                yield session.commitTransaction();
                session.endSession();
            }
            catch (err) {
                yield session.abortTransaction();
                session.endSession();
                throw err;
            }
        });
    }
    //Only callable by an administrator
    static createDepositIntent(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield mongoose_1.default.startSession();
            const { depositorAddress, units, platform, cryptoCode } = req.body;
            let tokenAddress;
            if (!platform && cryptoCode === "ETH") {
                // Native ETH deposit
                tokenAddress = "NATIVE_ETH";
            }
            else if (platform) {
                // ERC20 Token deposit
                const token = tokens_config_1.ERC20_TOKENS.find((t) => t.symbol.toUpperCase() === cryptoCode.toUpperCase());
                if (!token) {
                    return { status: false, message: "Token not supported" };
                }
                tokenAddress = (token === null || token === void 0 ? void 0 : token.address) || (platform === null || platform === void 0 ? void 0 : platform.token_address);
            }
            else {
                return { status: false, message: "Invalid platform or crypto code" };
            }
            const listingResponse = yield (0, cryptolisting_service_1.createListingForSale)(req, session);
            const listing = listingResponse.data;
            if (!listing) {
                throw new Error("Failed to create listing");
            }
            let intent = new depositIntent_model_1.DepositIntent({
                intentId: (0, uuid_1.v4)(),
                sender: depositorAddress.toLowerCase(),
                amount: units,
                tokenAddress: tokenAddress.toLowerCase(),
                account: listing.account,
                listing: listing._id,
                receiver: "",
            });
            intent.receivingAddress = EscrowManager.getReceivingAddress(intent);
            intent.amount = parseFloat(intent.amount) + 0.001; //0.001 simulates escrow fee.
            yield intent.save({ session });
            intent = JSON.parse(JSON.stringify(intent));
            intent.cryptoCode = listing === null || listing === void 0 ? void 0 : listing.cryptoCode;
            return {
                status: true,
                data: intent,
                message: "Redirecting to escrow details page",
            };
        });
    }
    static getReceivingAddress(intent) {
        return process.env.ESCROW_ADDRESS.toLowerCase();
    }
    static lockFundsForOrder(_a) {
        return __awaiter(this, arguments, void 0, function* ({ intentId, listingId, sellerId, buyerId, amount, checkoutId, walletToFund, toPay, }) {
            try {
                const intent = yield depositIntent_model_1.DepositIntent.findOne({ _id: intentId });
                if (!intent)
                    throw new Error("No deposit intent for this order");
                const listing = yield saleListing_model_1.default.findOne({ _id: listingId });
                if (!listing)
                    throw new Error("No listing was found for this order");
                const escrowAccount = yield escrow_model_1.default.findById(listing.escrow);
                if (!escrowAccount)
                    throw new Error("Escrow Account not found");
                const available = escrowAccount.availableEscrowBalance || 0;
                if (available < amount)
                    throw new Error("Insufficient available escrow balance");
                const seller = yield accounts_model_1.default.findById(sellerId);
                const buyer = yield accounts_model_1.default.findById(buyerId);
                if (!seller || !buyer)
                    throw new Error("Incomplete parties to transaction");
                // Deduct from available, add to locked
                const escrowId = escrowAccount._id;
                const orderCreationData = [
                    {
                        seller: seller._id,
                        buyer: buyer._id,
                        amount,
                        checkoutId: checkoutId,
                        status: "Pending",
                        listing: listingId,
                        walletToFund,
                        toPay,
                    },
                ];
                const cryptoListingData = {
                    checkOutId: checkoutId,
                    account: buyer._id,
                    cryptoListing: listingId,
                    walletAddress: walletToFund,
                    paymentOption: "p2p",
                    units: amount,
                    orderConfirmed: true,
                    paymentConfirmed: false,
                    fulfillmentStatus: "Not-Started",
                    buyerFulfillmentClaim: "Pending",
                    order: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                const metaData = {
                    cryptoListingData,
                    orderCreationData,
                    escrowId,
                    intent,
                };
                yield escrow_balance_queue_1.escrowBalanceQueue.add("lockEscrowFunds", {
                    buyerId,
                    escrowId,
                    amount,
                    metaData,
                });
                return {
                    status: true,
                    message: "Order reservation has been queued",
                    data: {},
                    intent
                };
            }
            catch (err) {
                throw err;
            }
        });
    }
    static releaseFunds(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                const order = yield orders_model_1.Order.findById(orderId).session(session);
                if (!order || order.status !== "pending")
                    throw new Error("Invalid or non-pending order");
                const seller = yield accounts_model_1.default.findById(order.seller).session(session);
                const buyer = yield accounts_model_1.default.findById(order.buyer).session(session);
                if (!seller || !buyer)
                    throw new Error("User not found");
                if ((seller.lockedEscrow || 0) < order.amount)
                    throw new Error("Locked escrow insufficient");
                seller.lockedEscrow -= order.amount;
                seller.escrowBalance -= order.amount;
                buyer.walletBalance = (buyer.walletBalance || 0) + order.amount;
                order.status = "released";
                yield Promise.all([
                    seller.save({ session }),
                    buyer.save({ session }),
                    order.save({ session }),
                ]);
                yield session.commitTransaction();
                session.endSession();
                return true;
            }
            catch (err) {
                yield session.abortTransaction();
                session.endSession();
                throw err;
            }
        });
    }
    static cancelOrder(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                const order = yield orders_model_1.Order.findById(orderId).session(session);
                if (!order || order.status !== "pending")
                    throw new Error("Invalid or non-pending order");
                const seller = yield accounts_model_1.default.findById(order.seller).session(session);
                if (!seller || (seller.lockedEscrow || 0) < order.amount)
                    throw new Error("Locked escrow insufficient");
                seller.lockedEscrow -= order.amount;
                order.status = "cancelled";
                yield Promise.all([seller.save({ session }), order.save({ session })]);
                yield session.commitTransaction();
                session.endSession();
                return true;
            }
            catch (err) {
                yield session.abortTransaction();
                session.endSession();
                throw err;
            }
        });
    }
    static getOrder(orderId) {
        return __awaiter(this, void 0, void 0, function* () {
            return orders_model_1.Order.findById(orderId).populate("seller buyer");
        });
    }
    static getUserBalance(accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield accounts_model_1.default.findById(accountId);
            if (!user)
                throw new Error("User not found");
            return {
                totalEscrow: user.escrowBalance || 0,
                locked: user.lockedEscrow || 0,
            };
        });
    }
}
exports.EscrowManager = EscrowManager;
__decorate([
    (0, transactions_decorator_1.MongooseTransaction)()
], EscrowManager, "initiateDeposit", null);
__decorate([
    (0, transactions_decorator_1.MongooseTransaction)()
], EscrowManager, "createDepositIntent", null);
