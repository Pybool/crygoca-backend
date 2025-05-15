import mongoose from "mongoose";
import Escrow from "../../models/escrow.model";
import CryptoListingPurchase from "../../models/listingPurchase.model";
import { Order } from "../../models/orders.model";
import mailActions from "../../services/v1/mail/mailservice";

/**
 * Increase total and available escrow balance when seller tops up
 */
export const topUpEscrow = async (escrowId: string, amount: number) => {
  const escrow = await Escrow.findOne({ _id: escrowId });
  if (!escrow) throw new Error("Escrow account not found");
  amount = Number(amount);

  escrow.totalEscrowBalance += amount;
  escrow.availableEscrowBalance += amount;

  await escrow.save();
  return escrow;
};

/**
 * Lock tokens for a pending order
 */
export const lockEscrowFunds = async (
  escrowId: string,
  amount: number,
  metaData: any
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const escrow = await Escrow.findById(escrowId);
    if (!escrow) throw new Error("Escrow account not found");

    if (escrow.availableEscrowBalance < amount) {
      throw new Error("Not enough available balance to lock");
    }

    escrow.availableEscrowBalance -= amount;
    escrow.lockedEscrowBalance += amount;

    const order = await Order.create(metaData.orderCreationData, { session });
    await order[0].populate("buyer")
    const populatedOrder = await order[0].populate("listing");

    metaData.cryptoListingData.order = order[0]._id;

    // const exists = await CryptoListingPurchase.findOne({
    //   checkOutId: metaData.cryptoListingData.checkOutId,
    // });

    const cryptoListingPurchase = await CryptoListingPurchase.findOneAndUpdate(
      { checkOutId: metaData.cryptoListingData.checkOutId },
      { $set: metaData.cryptoListingData },
      {
        upsert: true,
        new: true,
        session,
      }
    );

    await escrow.save({ session });
    await session.commitTransaction();
    session.endSession();
    mailActions.orders.sendBuyerLockedOrderMail(populatedOrder.buyer.email, {
      order: populatedOrder,
    });
    return {
      status: true,
      message: "Order reservation was successful",
      data: populatedOrder,
      intent: metaData.intent,
      cryptoListingPurchase,
    };
  } catch (err: any) {
    console.log(err);
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

/**
 * Dispense tokens that were previously locked (e.g. after delivery)
 */
export const dispenseLockedFunds = async (escrowId: string, amount: number) => {
  const escrow = await Escrow.findById(escrowId);
  if (!escrow) throw new Error("Escrow account not found");

  if (escrow.lockedEscrowBalance < amount) {
    throw new Error("Not enough locked balance to dispense");
  }

  escrow.lockedEscrowBalance -= amount;
  escrow.totalEscrowBalance -= amount;

  await escrow.save();
  return escrow;
};

/**
 * Dispense tokens directly from available balance (e.g. instant delivery)
 */
export const dispenseAvailableFunds = async (
  escrowId: string,
  amount: number
) => {
  const escrow = await Escrow.findById(escrowId);
  if (!escrow) throw new Error("Escrow account not found");

  if (escrow.availableEscrowBalance < amount) {
    throw new Error("Not enough available balance to dispense");
  }

  escrow.availableEscrowBalance -= amount;
  escrow.totalEscrowBalance -= amount;

  await escrow.save();
  return escrow;
};

/**
 * Release previously locked funds (e.g. order cancelled)
 */
export const releaseLockedFunds = async (
  escrowId: string,
  amount: number,
  checkOutId: string
) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const escrow = await Escrow.findById(escrowId);
    if (!escrow) throw new Error("Escrow account not found");

    if (escrow.lockedEscrowBalance < amount) {
      throw new Error("Not enough locked balance to release");
    }

    escrow.lockedEscrowBalance -= amount;
    escrow.availableEscrowBalance += amount;
    await escrow.save({ session });
    await CryptoListingPurchase.findOneAndDelete(
      { checkOutId: checkOutId },
      { session }
    );

    await Order.findOneAndDelete({ checkoutId: checkOutId }, { session });

    await session.commitTransaction();
    session.endSession();

    return escrow;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
