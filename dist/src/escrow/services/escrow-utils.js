"use strict";
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
exports.releaseLockedFunds = exports.dispenseAvailableFunds = exports.dispenseLockedFunds = exports.lockEscrowFunds = exports.topUpEscrow = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const escrow_model_1 = __importDefault(require("../../models/escrow.model"));
const listingPurchase_model_1 = __importDefault(require("../../models/listingPurchase.model"));
const orders_model_1 = require("../../models/orders.model");
/**
 * Increase total and available escrow balance when seller tops up
 */
const topUpEscrow = (escrowId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const escrow = yield escrow_model_1.default.findById(escrowId);
    if (!escrow)
        throw new Error("Escrow account not found");
    escrow.totalEscrowBalance += amount;
    escrow.availableEscrowBalance += amount;
    yield escrow.save();
    return escrow;
});
exports.topUpEscrow = topUpEscrow;
/**
 * Lock tokens for a pending order
 */
const lockEscrowFunds = (escrowId, amount, metaData) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const escrow = yield escrow_model_1.default.findById(escrowId);
        if (!escrow)
            throw new Error("Escrow account not found");
        if (escrow.availableEscrowBalance < amount) {
            throw new Error("Not enough available balance to lock");
        }
        escrow.availableEscrowBalance -= amount;
        escrow.lockedEscrowBalance += amount;
        const order = yield orders_model_1.Order.create(metaData.orderCreationData, { session });
        const populatedOrder = yield order[0].populate("listing");
        metaData.cryptoListingData.order = order[0]._id;
        const cryptoListingPurchase = yield listingPurchase_model_1.default.findOneAndUpdate({ checkOutId: metaData.cryptoListingData.checkoutId }, { $set: metaData.cryptoListingData }, {
            upsert: true,
            new: true,
            session,
        });
        yield escrow.save({ session });
        yield session.commitTransaction();
        session.endSession();
        return {
            status: true,
            message: "Order reservation was successful",
            data: populatedOrder,
            intent: metaData.intent,
            cryptoListingPurchase,
        };
    }
    catch (err) {
        yield session.abortTransaction();
        session.endSession();
        throw err;
    }
});
exports.lockEscrowFunds = lockEscrowFunds;
/**
 * Dispense tokens that were previously locked (e.g. after delivery)
 */
const dispenseLockedFunds = (escrowId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const escrow = yield escrow_model_1.default.findById(escrowId);
    if (!escrow)
        throw new Error("Escrow account not found");
    if (escrow.lockedEscrowBalance < amount) {
        throw new Error("Not enough locked balance to dispense");
    }
    escrow.lockedEscrowBalance -= amount;
    escrow.totalEscrowBalance -= amount;
    yield escrow.save();
    return escrow;
});
exports.dispenseLockedFunds = dispenseLockedFunds;
/**
 * Dispense tokens directly from available balance (e.g. instant delivery)
 */
const dispenseAvailableFunds = (escrowId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const escrow = yield escrow_model_1.default.findById(escrowId);
    if (!escrow)
        throw new Error("Escrow account not found");
    if (escrow.availableEscrowBalance < amount) {
        throw new Error("Not enough available balance to dispense");
    }
    escrow.availableEscrowBalance -= amount;
    escrow.totalEscrowBalance -= amount;
    yield escrow.save();
    return escrow;
});
exports.dispenseAvailableFunds = dispenseAvailableFunds;
/**
 * Release previously locked funds (e.g. order cancelled)
 */
const releaseLockedFunds = (escrowId, amount) => __awaiter(void 0, void 0, void 0, function* () {
    const escrow = yield escrow_model_1.default.findById(escrowId);
    if (!escrow)
        throw new Error("Escrow account not found");
    if (escrow.lockedEscrowBalance < amount) {
        throw new Error("Not enough locked balance to release");
    }
    escrow.lockedEscrowBalance -= amount;
    escrow.availableEscrowBalance += amount;
    yield escrow.save();
    return escrow;
});
exports.releaseLockedFunds = releaseLockedFunds;
