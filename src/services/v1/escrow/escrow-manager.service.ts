// services/escrow.service.ts
import mongoose from "mongoose";
import Accounts from "../../../models/accounts.model";
import { Order } from "../../../models/orders.model";
import Deposit from "../../../models/deposits.model";
import { ERC20_TOKENS } from "../../../escrow/config/tokens.config";
import { DepositIntent } from "../../../models/depositIntent.model";
import { v4 as uuidv4 } from "uuid";
import Xrequest from "../../../interfaces/extensions.interface";
import { createListingForSale } from "../listingsServices/cryptolisting.service";
import { MongooseTransaction } from "../../../decorators/transactions.decorator";
import CryptoListing from "../../../models/saleListing.model";
import Escrow from "../../../models/escrow.model";
import CryptoListingPurchase from "../../../models/listingPurchase.model";
import { escrowBalanceQueue } from "../../../escrow/queues/escrow-balance-queue";

export class EscrowManager {
  @MongooseTransaction()
  static async initiateDeposit(
    accountId: string,
    amount: number,
    currency: string
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const user = await Accounts.findById(accountId);
      if (!user) throw new Error("User not found");

      const payload = {
        amount,
        currency,
        accountId: new mongoose.Schema.Types.ObjectId(accountId),
      };
      await Deposit.create([payload], { session });
      await session.commitTransaction();
      session.endSession();
    } catch (err: any) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  //Only callable by an administrator
  @MongooseTransaction()
  static async createDepositIntent(req: Xrequest) {
    const session = await mongoose.startSession();
    const { depositorAddress, units, platform, cryptoCode } = req.body;
    let tokenAddress: string | undefined;

    if (!platform && cryptoCode === "ETH") {
      // Native ETH deposit
      tokenAddress = "NATIVE_ETH";
    } else if (platform) {
      // ERC20 Token deposit
      const token = ERC20_TOKENS.find(
        (t) => t.symbol.toUpperCase() === cryptoCode.toUpperCase()
      );
      if (!token) {
        return { status: false, message: "Token not supported" };
      }
      tokenAddress = token?.address || platform?.token_address;
    } else {
      return { status: false, message: "Invalid platform or crypto code" };
    }
    const listingResponse = await createListingForSale(req, session);
    const listing = listingResponse.data;

    if (!listing) {
      throw new Error("Failed to create listing");
    }

    let intent: any = new DepositIntent({
      intentId: uuidv4(),
      sender: depositorAddress.toLowerCase(),
      amount: units,
      tokenAddress: tokenAddress!.toLowerCase(),
      account: listing!.account,
      listing: listing!._id,
      receiver: "",
    });

    intent.receivingAddress = EscrowManager.getReceivingAddress(intent);
    intent.amount = parseFloat(intent.amount) + 0.001; //0.001 simulates escrow fee.
    await intent.save({ session });

    intent = JSON.parse(JSON.stringify(intent));
    intent.cryptoCode = listing?.cryptoCode;

    return {
      status: true,
      data: intent,
      message: "Redirecting to escrow details page",
    };
  }

  static getReceivingAddress(intent: any) {
    return process.env.ESCROW_ADDRESS!.toLowerCase();
  }

  static async lockFundsForOrder({
    intentId,
    listingId,
    sellerId,
    buyerId,
    amount,
    checkoutId,
    walletToFund,
    toPay,
  }: {
    intentId: string;
    listingId: string;
    sellerId: string;
    buyerId: string;
    checkoutId: string;
    amount: number;
    walletToFund: string;
    toPay: string;
  }): Promise<any> {
    try {
      const intent = await DepositIntent.findOne({ _id: intentId });
      if (!intent) throw new Error("No deposit intent for this order");

      const listing = await CryptoListing.findOne({ _id: listingId });
      if (!listing) throw new Error("No listing was found for this order");

      const escrowAccount = await Escrow.findById(listing.escrow);
      if (!escrowAccount) throw new Error("Escrow Account not found");

      const available = escrowAccount.availableEscrowBalance || 0;
      if (available < amount)
        throw new Error("Insufficient available escrow balance");

      const seller = await Accounts.findById(sellerId);
      const buyer = await Accounts.findById(buyerId);

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
      await escrowBalanceQueue.add("lockEscrowFunds", {
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
    } catch (err) {
      throw err;
    }
  }

  static async releaseFunds(orderId: string): Promise<boolean> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findById(orderId).session(session);
      if (!order || order.status !== "pending")
        throw new Error("Invalid or non-pending order");

      const seller = await Accounts.findById(order.seller).session(session);
      const buyer = await Accounts.findById(order.buyer).session(session);

      if (!seller || !buyer) throw new Error("User not found");
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
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  static async cancelOrder(orderId: string): Promise<boolean> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findById(orderId).session(session);
      if (!order || order.status !== "pending")
        throw new Error("Invalid or non-pending order");

      const seller = await Accounts.findById(order.seller).session(session);
      if (!seller || (seller.lockedEscrow || 0) < order.amount)
        throw new Error("Locked escrow insufficient");

      seller.lockedEscrow -= order.amount;
      order.status = "cancelled";

      await Promise.all([seller.save({ session }), order.save({ session })]);

      await session.commitTransaction();
      session.endSession();
      return true;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  static async getOrder(orderId: string) {
    return Order.findById(orderId).populate("seller buyer");
  }

  static async getUserBalance(accountId: string) {
    const user = await Accounts.findById(accountId);
    if (!user) throw new Error("User not found");

    return {
      totalEscrow: user.escrowBalance || 0,
      locked: user.lockedEscrow || 0,
    };
  }
}
