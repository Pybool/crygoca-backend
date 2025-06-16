"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
const mailservice_1 = __importDefault(require("../mail/mailservice"));
const accounts_chain_wallets_1 = __importDefault(require("../../../models/accounts-chain-wallets"));
const depositWallets_service_1 = require("./depositWallets.service");
const erc_listener_manager_service_1 = require("../../../escrow/services/listener-managers/erc-listener-manager.service");
const eth_native_listener_manager_service_1 = require("../../../escrow/services/listener-managers/eth-native-listener-manager.service");
const convert_crypto_1 = require("../../../helpers/convert-crypto");
class EscrowManager {
    static async initiateDeposit(accountId, amount, currency) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const user = await accounts_model_1.default.findById(accountId);
            if (!user)
                throw new Error("User not found");
            const payload = {
                amount,
                currency,
                accountId: new mongoose_1.default.Schema.Types.ObjectId(accountId),
            };
            await deposits_model_1.default.create([payload], { session });
            await session.commitTransaction();
            session.endSession();
        }
        catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }
    }
    //Only callable by an administrator
    static async createDepositIntent(req) {
        const session = await mongoose_1.default.startSession();
        const { depositorAddress, units, platform, cryptoCode, amount, isTopUp, listingId, blockchain, chainId, } = req.body;
        let tokenAddress;
        let tokenDecimal;
        if (cryptoCode === "ETH") {
            tokenAddress = "NATIVE_ETH";
        }
        else if (platform && cryptoCode !== "ETH") {
            const token = tokens_config_1.ERC20_TOKENS.find((t) => t.symbol.toUpperCase() === cryptoCode.toUpperCase());
            if (!token) {
                return { status: false, message: "Token not supported" };
            }
            tokenAddress = token?.address || platform?.token_address;
            tokenDecimal = token?.decimals;
        }
        else {
            return { status: false, message: "Invalid platform or crypto code" };
        }
        if (!isTopUp) {
            const listingResponse = await (0, cryptolisting_service_1.createListingForSale)(req, session);
            const listing = listingResponse.data;
            if (!listing) {
                throw new Error("Failed to create listing");
            }
            let walletInfo = await accounts_chain_wallets_1.default.findOne({
                account: listing.account._id,
                chainId: chainId,
            });
            if (!walletInfo) {
                walletInfo = await depositWallets_service_1.DepositWallets.createWallet(listing.account._id.toString(), chainId, session);
            }
            let intent = new depositIntent_model_1.DepositIntent({
                blockchain,
                chainId,
                intentId: (0, uuid_1.v4)(),
                sender: depositorAddress.toLowerCase(),
                amount: units,
                tokenAddress: tokenAddress.toLowerCase(),
                account: listing.account,
                listing: listing._id,
                receiver: "",
                isTopUp: isTopUp || false,
            });
            intent.receivingAddress = walletInfo.address.toLowerCase();
            intent.amount = parseFloat(intent.amount);
            const conversionResult = await (0, convert_crypto_1.convertCryptoToCrypto)("ETH", cryptoCode, intent.amount);
            if (conversionResult) {
                intent.gasFeeEth = conversionResult.originalAmount;
                intent.gasFeeToken = conversionResult.convertedAmount;
                intent.gasConversionRate = conversionResult.rate;
            }
            const filter = {
                sender: depositorAddress.toLowerCase(),
                tokenAddress: tokenAddress.toLowerCase(),
                status: "pending",
                receivingAddress: intent.receivingAddress,
                account: req.accountId,
            };
            const depositIntent = await depositIntent_model_1.DepositIntent.findOne(filter);
            if (depositIntent) {
                return {
                    status: false,
                    data: depositIntent,
                    message: "You have an existing deposit not yet completed or cancelled",
                };
            }
            let _intent = await intent.save({ session });
            await _intent.populate("account");
            await _intent.populate("listing");
            intent = JSON.parse(JSON.stringify(_intent));
            intent.cryptoCode = listing?.cryptoCode;
            this.setUpListenerManager(filter.account, intent.receivingAddress, platform, tokenAddress);
            mailservice_1.default.deposits.sendDepositIntentMail(_intent.account.email, {
                account: _intent.account,
                intent: _intent,
            });
            return {
                status: true,
                data: intent,
                tokenDecimals: tokenDecimal,
                message: "Redirecting to escrow details page",
            };
        }
        else {
            const listing = await saleListing_model_1.default.findOne({ _id: listingId });
            if (!listing) {
                throw new Error("Failed to create listing");
            }
            let walletInfo = await accounts_chain_wallets_1.default.findOne({
                account: listing.account._id,
                chainId: chainId,
            });
            if (!walletInfo) {
                walletInfo = await depositWallets_service_1.DepositWallets.createWallet(listing.account._id.toString(), chainId, session);
            }
            let intent = new depositIntent_model_1.DepositIntent({
                intentId: (0, uuid_1.v4)(),
                sender: depositorAddress.toLowerCase(),
                amount: amount,
                tokenAddress: tokenAddress.toLowerCase(),
                account: listing.account,
                listing: listing._id,
                receiver: "",
                isTopUp: isTopUp || false,
            });
            intent.receivingAddress = walletInfo.address;
            intent.amount = parseFloat(intent.amount);
            const conversionResult = await (0, convert_crypto_1.convertCryptoToCrypto)("ETH", cryptoCode, intent.amount);
            if (conversionResult) {
                intent.gasFeeEth = conversionResult.originalAmount;
                intent.gasFeeToken = conversionResult.convertedAmount;
                intent.gasConversionRate = conversionResult.rate;
            }
            const filter = {
                sender: depositorAddress.toLowerCase(),
                tokenAddress: tokenAddress.toLowerCase(),
                status: "pending",
                receivingAddress: intent.receivingAddress,
                account: req.accountId,
            };
            const depositIntent = await depositIntent_model_1.DepositIntent.findOne(filter);
            if (depositIntent) {
                return {
                    status: false,
                    data: depositIntent,
                    message: "You have an existing deposit not yet completed or cancelled",
                };
            }
            let _intent = await intent.save({ session });
            await _intent.populate("account");
            await _intent.populate("listing");
            intent = JSON.parse(JSON.stringify(_intent));
            intent.cryptoCode = listing?.cryptoCode;
            this.setUpListenerManager(filter.account, intent.receivingAddress, platform, tokenAddress);
            mailservice_1.default.deposits.sendDepositIntentMail(_intent.account.email, {
                account: _intent.account,
                intent: _intent,
            });
            return {
                status: true,
                data: intent,
                tokenDecimals: tokenDecimal,
                message: "Redirecting to escrow details page",
            };
        }
    }
    // static async fetchDepositIntents(req: Xrequest) {
    //   try {
    //     const {
    //       sender,
    //       searchText,
    //       tokenAddress,
    //       status,
    //       receivingAddress,
    //       page = 1,
    //       limit = 10,
    //     } = req.query;
    //     const query: any = {};
    //     if (sender) query.sender = sender.toString().toLowerCase();
    //     if (tokenAddress)
    //       query.tokenAddress = tokenAddress.toString().toLowerCase();
    //     if (searchText) query.searchText = searchText.toString();
    //     if (status) query.status = status.toString().toLowerCase();
    //     if (receivingAddress)
    //       query.receivingAddress = receivingAddress.toString().toLowerCase();
    //     const skip = (Number(page) - 1) * Number(limit);
    //     const [items, total] = await Promise.all([
    //       DepositIntent.find(query)
    //         .populate("listing")
    //         .sort({ createdAt: -1 })
    //         .skip(skip)
    //         .limit(Number(limit)),
    //       DepositIntent.countDocuments(query),
    //     ]);
    //     return {
    //       status: true,
    //       data: items,
    //       pagination: {
    //         total,
    //         page: Number(page),
    //         limit: Number(limit),
    //         pages: Math.ceil(total / Number(limit)),
    //       },
    //     };
    //   } catch (error: any) {
    //     throw new Error(`Failed to fetch deposit intents: ${error.message}`);
    //   }
    // }
    static async fetchDepositIntents(req) {
        try {
            const { sender, searchText, tokenAddress, status, receivingAddress, page = 1, limit = 10, } = req.query;
            const matchStage = {};
            if (sender)
                matchStage.sender = sender.toString().toLowerCase();
            if (tokenAddress)
                matchStage.tokenAddress = tokenAddress.toString().toLowerCase();
            if (status)
                matchStage.status = status.toString().toLowerCase();
            if (receivingAddress)
                matchStage.receivingAddress = receivingAddress.toString().toLowerCase();
            const skip = (Number(page) - 1) * Number(limit);
            const aggregation = [
                { $match: matchStage },
                {
                    $lookup: {
                        from: "cryptolistings",
                        localField: "listing",
                        foreignField: "_id",
                        as: "listing",
                    },
                },
                { $unwind: { path: "$listing", preserveNullAndEmptyArrays: true } },
            ];
            let regex = null;
            if (searchText) {
                regex = new RegExp(searchText.toString(), "i");
                aggregation.push({
                    $match: {
                        $or: [
                            { "listing.cryptoName": regex },
                            { "listing.cryptoCode": regex },
                            { sender: regex },
                            { receivingAddress: regex },
                            { status: searchText },
                        ],
                    },
                });
            }
            aggregation.push({ $sort: { createdAt: -1 } }, { $skip: skip }, { $limit: Number(limit) });
            const [items, totalCount] = await Promise.all([
                depositIntent_model_1.DepositIntent.aggregate(aggregation),
                depositIntent_model_1.DepositIntent.aggregate([
                    { $match: matchStage },
                    {
                        $lookup: {
                            from: "cryptolistings",
                            localField: "listing",
                            foreignField: "_id",
                            as: "listing",
                        },
                    },
                    { $unwind: { path: "$listing", preserveNullAndEmptyArrays: true } },
                    ...(searchText
                        ? [
                            {
                                $match: {
                                    $or: [
                                        { "listing.cryptoName": regex },
                                        { "listing.cryptoCode": regex },
                                        { sender: regex },
                                        { receivingAddress: regex },
                                        { status: searchText },
                                    ],
                                },
                            },
                        ]
                        : []),
                    { $count: "total" },
                ]).then((res) => res[0]?.total || 0),
            ]);
            return {
                status: true,
                data: items,
                pagination: {
                    total: totalCount,
                    page: Number(page),
                    limit: Number(limit),
                    pages: Math.ceil(totalCount / Number(limit)),
                },
            };
        }
        catch (error) {
            throw new Error(`Failed to fetch deposit intents: ${error.message}`);
        }
    }
    static async lockFundsForOrder({ intentId, listingId, sellerId, buyerId, amount, checkoutId, walletToFund, toPay, selectedBank, }) {
        try {
            // const intent = await DepositIntent.findOne({ _id: intentId });
            // if (!intent) throw new Error("No deposit intent for this order");
            const listing = await saleListing_model_1.default.findOne({ _id: listingId });
            if (!listing)
                throw new Error("No listing was found for this order");
            const escrowAccount = await escrow_model_1.default.findById(listing.escrow);
            if (!escrowAccount)
                throw new Error("Escrow Account not found");
            const available = escrowAccount.availableEscrowBalance || 0;
            if (available < amount)
                throw new Error("Insufficient available escrow balance");
            const seller = await accounts_model_1.default.findById(sellerId);
            const buyer = await accounts_model_1.default.findById(buyerId);
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
                    selectedBank,
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
                intent: null,
            };
            await escrow_balance_queue_1.escrowBalanceQueue.add("lockEscrowFunds", {
                buyerId,
                escrowId,
                amount,
                metaData,
            });
            return {
                status: true,
                message: "Order reservation has been queued",
                data: {},
                intent: null,
            };
        }
        catch (err) {
            throw err;
        }
    }
    static async releaseFunds(orderId) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const order = await orders_model_1.Order.findById(orderId).session(session);
            if (!order || order.status !== "pending")
                throw new Error("Invalid or non-pending order");
            const seller = await accounts_model_1.default.findById(order.seller).session(session);
            const buyer = await accounts_model_1.default.findById(order.buyer).session(session);
            if (!seller || !buyer)
                throw new Error("User not found");
            if ((seller.lockedEscrow || 0) < order.amount)
                throw new Error("Locked escrow insufficient");
            seller.lockedEscrow -= order.amount;
            seller.escrowBalance -= order.amount;
            buyer.walletBalance = (buyer.walletBalance || 0) + order.amount;
            order.status = "released";
            await Promise.all([
                seller.save({ session }),
                buyer.save({ session }),
                order.save({ session }),
            ]);
            await session.commitTransaction();
            session.endSession();
            return true;
        }
        catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }
    }
    static async cancelDeposit(depositId) {
        try {
            const deposit = await depositIntent_model_1.DepositIntent.findOneAndDelete({
                intentId: depositId,
            });
            if (!deposit) {
                return {
                    status: false,
                    message: "No such deposit intent was found",
                };
            }
            if (deposit.tokenAddress !== "native_eth") {
                await new erc_listener_manager_service_1.ERC20ListenerManager().removeEscrowAddress(deposit.account.toString(), deposit.receivingAddress);
            }
            else {
                await new eth_native_listener_manager_service_1.ETHNativeListenerManager().removeEscrowAddress(deposit.account.toString(), deposit.receivingAddress);
            }
            return {
                status: true,
                message: "Deposit intent was cancelled successfully",
            };
        }
        catch (err) {
            throw err;
        }
    }
    static async cancelOrder(orderId) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const order = await orders_model_1.Order.findOne({ _id: orderId })
                .populate("listing")
                .session(session);
            if (!order || order.status !== "Pending")
                throw new Error("Invalid or non-pending order");
            const escrowAccount = await escrow_model_1.default.findById(order.listing.escrow);
            if (!escrowAccount)
                throw new Error("Escrow Account not found");
            const buyerId = order.buyer;
            const escrowId = escrowAccount._id;
            const amount = order.amount;
            order.status = "cancelled";
            await escrow_balance_queue_1.escrowBalanceQueue.add("releaseLockedFunds", {
                buyerId,
                escrowId,
                amount,
                metaData: { checkOutId: order.checkoutId },
            });
            await session.commitTransaction();
            session.endSession();
            return {
                status: true,
                message: "Your order has been queued for cancellation",
            };
        }
        catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }
    }
    static async getOrder(orderId) {
        return orders_model_1.Order.findById(orderId).populate("seller buyer");
    }
    static async getUserBalance(accountId) {
        const user = await accounts_model_1.default.findById(accountId);
        if (!user)
            throw new Error("User not found");
        return {
            totalEscrow: user.escrowBalance || 0,
            locked: user.lockedEscrow || 0,
        };
    }
    static async setUpListenerManager(acccountId, escrowAddress, platform, tokenAddress) {
        if ((platform.id === 1 || platform.name === "Ethereum") &&
            tokenAddress !== "NATIVE_ETH") {
            const erc20ListenerManager = new erc_listener_manager_service_1.ERC20ListenerManager();
            erc20ListenerManager.addEscrowAddress(acccountId, escrowAddress);
        }
        if ((platform.id === 1 || platform.name === "Ethereum") &&
            tokenAddress === "NATIVE_ETH") {
            const ethNativeListenerManager = new eth_native_listener_manager_service_1.ETHNativeListenerManager();
            ethNativeListenerManager.addEscrowAddress(acccountId, escrowAddress);
        }
    }
}
exports.EscrowManager = EscrowManager;
__decorate([
    (0, transactions_decorator_1.MongooseTransaction)()
], EscrowManager, "initiateDeposit", null);
__decorate([
    (0, transactions_decorator_1.MongooseTransaction)()
], EscrowManager, "createDepositIntent", null);
