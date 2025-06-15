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
import { escrowBalanceQueue } from "../../../escrow/queues/escrow-balance-queue";
import message from "../../../helpers/messages";
import mailActions from "../mail/mailservice";
import BlockChainWallets, {
  IChainWallets,
} from "../../../models/accounts-chain-wallets";
import { DepositWallets } from "./depositWallets.service";
import { ERC20ListenerManager } from "../../../escrow/services/listener-managers/erc-listener-manager.service";
import { ETHNativeListenerManager } from "../../../escrow/services/listener-managers/eth-native-listener-manager.service";
import { convertCryptoToCrypto } from "../../../helpers/convert-crypto";

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
    const {
      depositorAddress,
      units,
      platform,
      cryptoCode,
      amount,
      isTopUp,
      listingId,
      blockchain,
      chainId,
    } = req.body;
    let tokenAddress: string | undefined;
    let tokenDecimal: number | undefined;

    if (cryptoCode === "ETH") {
      tokenAddress = "NATIVE_ETH";
    } else if (platform && cryptoCode !== "ETH") {
      const token = ERC20_TOKENS.find(
        (t) => t.symbol.toUpperCase() === cryptoCode.toUpperCase()
      );
      if (!token) {
        return { status: false, message: "Token not supported" };
      }
      tokenAddress = token?.address || platform?.token_address;
      tokenDecimal = token?.decimals;
    } else {
      return { status: false, message: "Invalid platform or crypto code" };
    }

    if (!isTopUp) {
      const listingResponse = await createListingForSale(req, session);
      const listing = listingResponse.data;

      if (!listing) {
        throw new Error("Failed to create listing");
      }

      let walletInfo: IChainWallets | null = await BlockChainWallets.findOne({
        account: listing!.account._id,
        chainId: chainId,
      });

      if (!walletInfo) {
        walletInfo = await DepositWallets.createWallet(
          listing!.account._id.toString(),
          chainId,
          session
        );
      }

      let intent: any = new DepositIntent({
        blockchain,
        chainId,
        intentId: uuidv4(),
        sender: depositorAddress.toLowerCase(),
        amount: units,
        tokenAddress: tokenAddress!.toLowerCase(),
        account: listing!.account,
        listing: listing!._id,
        receiver: "",
        isTopUp: isTopUp || false,
      });

      intent.receivingAddress = walletInfo.address.toLowerCase();
      intent.amount = parseFloat(intent.amount);
      const conversionResult = await convertCryptoToCrypto(
        "ETH",
        cryptoCode,
        intent.amount
      );
      if (conversionResult) {
        intent.gasFeeEth = conversionResult.originalAmount;
        intent.gasFeeToken = conversionResult.convertedAmount;
        intent.gasConversionRate = conversionResult.rate;
      }

      const filter = {
        sender: depositorAddress.toLowerCase(),
        tokenAddress: tokenAddress!.toLowerCase(),
        status: "pending",
        receivingAddress: intent.receivingAddress,
        account: req.accountId,
      };

      const depositIntent = await DepositIntent.findOne(filter);
      if (depositIntent) {
        return {
          status: false,
          data: depositIntent,
          message:
            "You have an existing deposit not yet completed or cancelled",
        };
      }

      let _intent = await intent.save({ session });
      await _intent.populate("account");
      await _intent.populate("listing");

      intent = JSON.parse(JSON.stringify(_intent));
      intent.cryptoCode = listing?.cryptoCode;
      this.setUpListenerManager(
        filter.account!,
        intent.receivingAddress,
        platform,
        tokenAddress!
      );
      mailActions.deposits.sendDepositIntentMail(_intent.account.email, {
        account: _intent.account,
        intent: _intent,
      });

      return {
        status: true,
        data: intent,
        tokenDecimals: tokenDecimal,
        message: "Redirecting to escrow details page",
      };
    } else {
      const listing = await CryptoListing.findOne({ _id: listingId });

      if (!listing) {
        throw new Error("Failed to create listing");
      }

      let walletInfo: IChainWallets | null = await BlockChainWallets.findOne({
        account: listing!.account._id,
        chainId: chainId,
      });
      if (!walletInfo) {
        walletInfo = await DepositWallets.createWallet(
          listing!.account._id.toString(),
          chainId,
          session
        );
      }

      let intent: any = new DepositIntent({
        intentId: uuidv4(),
        sender: depositorAddress.toLowerCase(),
        amount: amount,
        tokenAddress: tokenAddress!.toLowerCase(),
        account: listing!.account,
        listing: listing!._id,
        receiver: "",
        isTopUp: isTopUp || false,
      });

      intent.receivingAddress = walletInfo.address;
      intent.amount = parseFloat(intent.amount);
      const conversionResult = await convertCryptoToCrypto(
        "ETH",
        cryptoCode,
        intent.amount
      );
      if (conversionResult) {
        intent.gasFeeEth = conversionResult.originalAmount;
        intent.gasFeeToken = conversionResult.convertedAmount;
        intent.gasConversionRate = conversionResult.rate;
      }

      const filter = {
        sender: depositorAddress.toLowerCase(),
        tokenAddress: tokenAddress!.toLowerCase(),
        status: "pending",
        receivingAddress: intent.receivingAddress,
        account: req.accountId,
      };

      const depositIntent = await DepositIntent.findOne(filter);
      if (depositIntent) {
        return {
          status: false,
          data: depositIntent,
          message:
            "You have an existing deposit not yet completed or cancelled",
        };
      }

      let _intent = await intent.save({ session });
      await _intent.populate("account");
      await _intent.populate("listing");

      intent = JSON.parse(JSON.stringify(_intent));
      intent.cryptoCode = listing?.cryptoCode;
      this.setUpListenerManager(
        filter.account!,
        intent.receivingAddress,
        platform,
        tokenAddress!
      );
      mailActions.deposits.sendDepositIntentMail(_intent.account.email, {
        account: _intent.account,
        intent: _intent,
      });
      console.log("Done Sending mail");

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
  static async fetchDepositIntents(req: Xrequest) {
    try {
      const {
        sender,
        searchText,
        tokenAddress,
        status,
        receivingAddress,
        page = 1,
        limit = 10,
      } = req.query;

      const matchStage: any = {};

      if (sender) matchStage.sender = sender.toString().toLowerCase();
      if (tokenAddress)
        matchStage.tokenAddress = tokenAddress.toString().toLowerCase();
      if (status) matchStage.status = status.toString().toLowerCase();
      if (receivingAddress)
        matchStage.receivingAddress = receivingAddress.toString().toLowerCase();

      const skip = (Number(page) - 1) * Number(limit);

      const aggregation: any[] = [
        { $match: matchStage },
        {
          $lookup: {
            from: "cryptolistings", // ⚠️ Match the actual MongoDB collection name
            localField: "listing",
            foreignField: "_id",
            as: "listing",
          },
        },
        { $unwind: { path: "$listing", preserveNullAndEmptyArrays: true } },
      ];
      let regex: any = null;

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

      aggregation.push(
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: Number(limit) }
      );

      const [items, totalCount] = await Promise.all([
        DepositIntent.aggregate(aggregation),
        DepositIntent.aggregate([
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
    } catch (error: any) {
      throw new Error(`Failed to fetch deposit intents: ${error.message}`);
    }
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
    selectedBank,
  }: {
    intentId: string;
    listingId: string;
    sellerId: string;
    buyerId: string;
    checkoutId: string;
    amount: number;
    walletToFund: string;
    toPay: string;
    selectedBank: any;
  }): Promise<any> {
    try {
      // const intent = await DepositIntent.findOne({ _id: intentId });
      // if (!intent) throw new Error("No deposit intent for this order");

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
        intent: null,
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

  static async cancelDeposit(depositId: string) {
    try {
      const deposit = await DepositIntent.findOneAndDelete({
        intentId: depositId,
      });
      if (!deposit) {
        return {
          status: false,
          message: "No such deposit intent was found",
        };
      }
      if (deposit.tokenAddress !== "native_eth") {
        await new ERC20ListenerManager().removeEscrowAddress(
          deposit.account.toString(),
          deposit.receivingAddress!
        );
      } else {
        await new ETHNativeListenerManager().removeEscrowAddress(
          deposit.account.toString(),
          deposit.receivingAddress!
        );
      }

      return {
        status: true,
        message: "Deposit intent was cancelled successfully",
      };
    } catch (err) {
      throw err;
    }
  }

  static async cancelOrder(orderId: string): Promise<any> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await Order.findOne({ _id: orderId })
        .populate("listing")
        .session(session);
      if (!order || order.status !== "Pending")
        throw new Error("Invalid or non-pending order");

      const escrowAccount = await Escrow.findById(order.listing.escrow);
      if (!escrowAccount) throw new Error("Escrow Account not found");

      const buyerId = order.buyer;
      const escrowId = escrowAccount._id;
      const amount = order.amount;

      order.status = "cancelled";

      await escrowBalanceQueue.add("releaseLockedFunds", {
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

  private static async setUpListenerManager(
    acccountId: string,
    escrowAddress: string,
    platform: any,
    tokenAddress: string
  ) {
    if (
      (platform.id === 1 || platform.name === "Ethereum") &&
      tokenAddress !== "NATIVE_ETH"
    ) {
      const erc20ListenerManager = new ERC20ListenerManager();
      erc20ListenerManager.addEscrowAddress(acccountId, escrowAddress);
    }

    if (
      (platform.id === 1 || platform.name === "Ethereum") &&
      tokenAddress === "NATIVE_ETH"
    ) {
      const ethNativeListenerManager = new ETHNativeListenerManager();
      ethNativeListenerManager.addEscrowAddress(acccountId, escrowAddress);
    }
  }
}
