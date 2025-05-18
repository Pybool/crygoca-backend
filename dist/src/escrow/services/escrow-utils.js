"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.releaseLockedFunds = exports.dispenseAvailableFunds = exports.dispenseLockedFunds = exports.lockEscrowFunds = exports.topUpEscrow = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const escrow_model_1 = __importDefault(require("../../models/escrow.model"));
const listingPurchase_model_1 = __importDefault(require("../../models/listingPurchase.model"));
const orders_model_1 = require("../../models/orders.model");
const mailservice_1 = __importDefault(require("../../services/v1/mail/mailservice"));
/**
 * Increase total and available escrow balance when seller tops up
 */
const topUpEscrow = async (escrowId, amount) => {
    const escrow = await escrow_model_1.default.findOne({ _id: escrowId });
    if (!escrow)
        throw new Error("Escrow account not found");
    amount = Number(amount);
    escrow.totalEscrowBalance += amount;
    escrow.availableEscrowBalance += amount;
    await escrow.save();
    return escrow;
};
exports.topUpEscrow = topUpEscrow;
/**
 * Lock tokens for a pending order
 */
const lockEscrowFunds = async (escrowId, amount, metaData) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const escrow = await escrow_model_1.default.findById(escrowId);
        if (!escrow)
            throw new Error("Escrow account not found");
        if (escrow.availableEscrowBalance < amount) {
            throw new Error("Not enough available balance to lock");
        }
        escrow.availableEscrowBalance -= amount;
        escrow.lockedEscrowBalance += amount;
        const order = await orders_model_1.Order.create(metaData.orderCreationData, { session });
        await order[0].populate("buyer");
        const populatedOrder = await order[0].populate("listing");
        metaData.cryptoListingData.order = order[0]._id;
        // const exists = await CryptoListingPurchase.findOne({
        //   checkOutId: metaData.cryptoListingData.checkOutId,
        // });
        const cryptoListingPurchase = await listingPurchase_model_1.default.findOneAndUpdate({ checkOutId: metaData.cryptoListingData.checkOutId }, { $set: metaData.cryptoListingData }, {
            upsert: true,
            new: true,
            session,
        });
        await escrow.save({ session });
        await session.commitTransaction();
        session.endSession();
        mailservice_1.default.orders.sendBuyerLockedOrderMail(populatedOrder.buyer.email, {
            order: populatedOrder,
        });
        return {
            status: true,
            message: "Order reservation was successful",
            data: populatedOrder,
            intent: metaData.intent,
            cryptoListingPurchase,
        };
    }
    catch (err) {
        console.log(err);
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
};
exports.lockEscrowFunds = lockEscrowFunds;
/**
 * Dispense tokens that were previously locked (e.g. after delivery)
 */
const dispenseLockedFunds = async (escrowId, amount) => {
    const escrow = await escrow_model_1.default.findById(escrowId);
    if (!escrow)
        throw new Error("Escrow account not found");
    if (escrow.lockedEscrowBalance < amount) {
        throw new Error("Not enough locked balance to dispense");
    }
    escrow.lockedEscrowBalance -= amount;
    escrow.totalEscrowBalance -= amount;
    await escrow.save();
    return escrow;
};
exports.dispenseLockedFunds = dispenseLockedFunds;
/**
 * Dispense tokens directly from available balance (e.g. instant delivery)
 */
const dispenseAvailableFunds = async (escrowId, amount) => {
    const escrow = await escrow_model_1.default.findById(escrowId);
    if (!escrow)
        throw new Error("Escrow account not found");
    if (escrow.availableEscrowBalance < amount) {
        throw new Error("Not enough available balance to dispense");
    }
    escrow.availableEscrowBalance -= amount;
    escrow.totalEscrowBalance -= amount;
    await escrow.save();
    return escrow;
};
exports.dispenseAvailableFunds = dispenseAvailableFunds;
/**
 * Release previously locked funds (e.g. order cancelled)
 */
const releaseLockedFunds = async (escrowId, amount, checkOutId) => {
    const session = await mongoose_1.default.startSession();
    try {
        session.startTransaction();
        const escrow = await escrow_model_1.default.findById(escrowId);
        if (!escrow)
            throw new Error("Escrow account not found");
        if (escrow.lockedEscrowBalance < amount) {
            throw new Error("Not enough locked balance to release");
        }
        escrow.lockedEscrowBalance -= amount;
        escrow.availableEscrowBalance += amount;
        await escrow.save({ session });
        await listingPurchase_model_1.default.findOneAndDelete({ checkOutId: checkOutId }, { session });
        await orders_model_1.Order.findOneAndDelete({ checkoutId: checkOutId }, { session });
        await session.commitTransaction();
        session.endSession();
        return escrow;
    }
    catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};
exports.releaseLockedFunds = releaseLockedFunds;
