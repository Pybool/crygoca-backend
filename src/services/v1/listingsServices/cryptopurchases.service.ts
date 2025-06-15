import mongoose from "mongoose";
import Xrequest from "../../../interfaces/extensions.interface";
import CryptoListingPurchase, {
  orderStatuses,
} from "../../../models/listingPurchase.model";
import { NotificationModel } from "../../../models/notifications.model";
import VerifiedTransactions from "../../../models/verifiedtransactions.model";
import mailActions, { IEmailCheckoutData } from "../mail/mailservice";
import Accounts from "../../../models/accounts.model";
import { Order } from "../../../models/orders.model";
import {
  ERC20Transfer,
  IErc20Transfer,
} from "../../../crypto-transfers/scripts/enqueueTransfer";
import { ERC20_TOKENS } from "../../../escrow/config/tokens.config";
import { RegisterERC20Payout, RegisterNativeETHPayout } from "./crypto-payouts";
import Escrow from "../../../models/escrow.model";
import Complaint, { IComplaint } from "../../../models/complaints.model";

export const fetchOrders = async (req: Xrequest) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const searchText: string = (req.query.searchText as string) || "";
    const userId: string = req.accountId as string; // Assuming userId is passed as query parameter

    const skip = (page - 1) * limit;

    // Define common aggregation stages
    const commonAggregationStages: any = [
      {
        $lookup: {
          from: "accounts",
          localField: "account",
          foreignField: "_id",
          as: "accountDetails",
        },
      },
      {
        $unwind: "$account", // Unwind accountDetails array
      },
      {
        $lookup: {
          from: "cryptolistings",
          localField: "cryptoListing",
          foreignField: "_id",
          as: "cryptoListing",
        },
      },
      {
        $unwind: "$cryptoListing", // Unwind cryptoCurrencyDetails array
      },
      // Adding this lookup to populate the 'account' field inside the cryptoListing
      {
        $lookup: {
          from: "accounts", // The accounts collection to join with
          localField: "cryptoListing.account", // The field in the cryptoListing that links to the accounts collection
          foreignField: "_id", // Match it with the _id field in the accounts collection
          as: "cryptoListing.accountDetails", // The alias for the populated account
        },
      },
      {
        $unwind: {
          path: "$cryptoListing.accountDetails", // Unwind the accountDetails inside cryptoListing
          preserveNullAndEmptyArrays: true, // Optional: this will include entries even if there is no match for accountDetails
        },
      },
      // Add a new lookup for verifiedTransaction field
      {
        $lookup: {
          from: "orders", // Replace with the collection containing the verifiedTransaction details
          localField: "order", // Field in CryptoListingPurchase that links to the transactions
          foreignField: "_id", // Field in transactions to match
          as: "order", // Alias for the populated transaction
        },
      },
      {
        $unwind: "$order",
      },
    ];

    // Define the aggregation pipeline for fetching listings
    const aggregationPipeline: any = [
      ...commonAggregationStages,
      {
        $match: {
          $and: [
            {
              // Match orders for a specific userId
              "cryptoListing.account": new mongoose.Types.ObjectId(userId),
            },
            {
              orderConfirmed: true,
            },

            {
              $or: [
                {
                  checkOutId: {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  fulfillmentStatus: {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  walletAddress: {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  "accountDetails.username": {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  "cryptoListing.tags": {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  "cryptoListing.cryptoName": {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  "cryptoListing.cryptoCode": {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  "cryptoListing.currency": {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  "cryptoListing.cryptoLogo": {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
              ],
            },
          ],
        },
      },

      { $sort: { createdAt: -1 } }, // Sort by creation date (descending)
      { $skip: skip }, // Pagination: Skip
      { $limit: limit }, // Pagination: Limit
    ];

    // Run the aggregation to fetch listings
    const orders = await CryptoListingPurchase.aggregate(aggregationPipeline);

    // Define the aggregation pipeline for counting total matching orders
    const countAggregationPipeline = [
      ...commonAggregationStages,
      {
        $match: {
          $and: [
            {
              // Match orders for a specific userId
              "cryptoListing.account": new mongoose.Types.ObjectId(userId),
            },
            {
              orderConfirmed: true,
            },
            {
              $or: [
                {
                  checkOutId: {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  fulfillmentStatus: {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  walletAddress: {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  "accountDetails.username": {
                    $regex: new RegExp(searchText, "i"),
                  },
                }, // Search for username
                {
                  "cryptoListing.tags": {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  "cryptoListing.cryptoName": {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  "cryptoListing.cryptoCode": {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  "cryptoListing.currency": {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  "cryptoListing.cryptoLogo": {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
              ],
            },
          ],
        },
      },
      { $count: "totalCount" }, // Count the total matching results
    ];

    // Run the aggregation to count the total matching orders
    const totalOrders = await CryptoListingPurchase.aggregate(
      countAggregationPipeline
    );

    // Extract the total count from the result
    const totalOrdersCount =
      totalOrders.length > 0 ? totalOrders[0].totalCount : 0;

    return {
      status: true,
      message: "Results fetched successfully",
      data: orders,
      pagination: {
        currentPage: page,
        totalItems: totalOrdersCount,
        totalPages: Math.ceil(totalOrdersCount / limit),
        itemsPerPage: limit,
      },
      code: 200,
    };
  } catch (error: any) {
    throw error;
  }
};

export const fetchMyOrders = async (req: Xrequest) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const searchText: string = (req.query.searchText as string) || "";
    const userId: string = req.accountId as string;

    const skip = (page - 1) * limit;

    // Define common aggregation stages
    const commonAggregationStages: any = [
      {
        $lookup: {
          from: "accounts",
          localField: "account",
          foreignField: "_id",
          as: "accountDetails",
        },
      },
      {
        $unwind: "$account", // Unwind accountDetails array
      },
      {
        $lookup: {
          from: "cryptolistings",
          localField: "cryptoListing",
          foreignField: "_id",
          as: "cryptoListing",
        },
      },
      {
        $unwind: "$cryptoListing", // Unwind cryptoCurrencyDetails array
      },
      // Add a new lookup for verifiedTransaction field
      {
        $lookup: {
          from: "orders", // Replace with the collection containing the verifiedTransaction details
          localField: "order", // Field in CryptoListingPurchase that links to the transactions
          foreignField: "_id", // Field in transactions to match
          as: "order", // Alias for the populated transaction
        },
      },
      {
        $unwind: "$order",
      },
      // Adding this lookup to populate the 'account' field inside the cryptoListing
      {
        $lookup: {
          from: "accounts", // The accounts collection to join with
          localField: "cryptoListing.account", // The field in the cryptoListing that links to the accounts collection
          foreignField: "_id", // Match it with the _id field in the accounts collection
          as: "cryptoListing.accountDetails", // The alias for the populated account
        },
      },
      {
        $unwind: {
          path: "$cryptoListing.accountDetails", // Unwind the accountDetails inside cryptoListing
          preserveNullAndEmptyArrays: true, // Optional: this will include entries even if there is no match for accountDetails
        },
      },
    ];

    // Define the aggregation pipeline for fetching listings
    const aggregationPipeline: any = [
      ...commonAggregationStages,
      {
        $match: {
          $and: [
            {
              // Match orders for a specific userId
              account: new mongoose.Types.ObjectId(userId),
            },

            {
              orderConfirmed: true,
            },

            {
              $or: [
                {
                  checkOutId: {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  fulfillmentStatus: {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  buyerFulfillmentClaim: {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  walletAddress: {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  "cryptoListing.accountDetails.username": {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  "cryptoListing.tags": {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  "cryptoListing.cryptoName": {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  "cryptoListing.cryptoCode": {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  "cryptoListing.currency": {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  "cryptoListing.cryptoLogo": {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
              ],
            },
          ],
        },
      },

      { $sort: { createdAt: -1 } }, // Sort by creation date (descending)
      { $skip: skip }, // Pagination: Skip
      { $limit: limit }, // Pagination: Limit
    ];

    // Run the aggregation to fetch listings
    const orders = await CryptoListingPurchase.aggregate(aggregationPipeline);

    // Define the aggregation pipeline for counting total matching orders
    const countAggregationPipeline = [
      ...commonAggregationStages,
      {
        $match: {
          $and: [
            {
              // Match orders for a specific userId
              account: new mongoose.Types.ObjectId(userId),
            },

            {
              orderConfirmed: true,
            },

            {
              $or: [
                {
                  checkOutId: {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  fulfillmentStatus: {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  buyerFulfillmentClaim: {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  walletAddress: {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  "cryptoListing.accountDetails.username": {
                    $regex: new RegExp(searchText, "i"),
                  },
                }, // Search for username
                {
                  "cryptoListing.tags": {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  "cryptoListing.cryptoName": {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  "cryptoListing.cryptoCode": {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  "cryptoListing.currency": {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
                {
                  "cryptoListing.cryptoLogo": {
                    $regex: new RegExp(searchText, "i"),
                  },
                },
              ],
            },
          ],
        },
      },
      { $count: "totalCount" }, // Count the total matching results
    ];

    // Run the aggregation to count the total matching orders
    const totalOrders = await CryptoListingPurchase.aggregate(
      countAggregationPipeline
    );

    // Extract the total count from the result
    const totalOrdersCount =
      totalOrders.length > 0 ? totalOrders[0].totalCount : 0;

    return {
      status: true,
      message: "Results fetched successfully",
      data: orders,
      pagination: {
        currentPage: page,
        totalItems: totalOrdersCount,
        totalPages: Math.ceil(totalOrdersCount / limit),
        itemsPerPage: limit,
      },
      code: 200,
    };
  } catch (error: any) {
    throw error;
  }
};

export const updateStatus = async (req: Xrequest) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const accountId: string = req.accountId! as string;
    const data: { status: string; listingPurchaseId: string } = req.body;
    if (!orderStatuses.includes(data.status)) {
      return {
        status: false,
        message: "Invalid order status in request",
        code: 400,
      };
    }

    let listingPurchase: any = await CryptoListingPurchase.findOne({
      _id: data.listingPurchaseId,
    })
      .populate("account")
      // .populate("cryptoListing");
      .populate({
        path: "cryptoListing",
        populate: {
          path: "cryptoCurrency",
        },
      });

    if (listingPurchase) {
      if (!listingPurchase.orderConfirmed) {
        return {
          status: false,
          message: "This order's payment has not yet been confirmed.",
          code: 422,
        };
      }
      if (listingPurchase.cryptoListing.account._id?.toString() !== accountId) {
        return {
          status: false,
          message:
            "Unauthorized/Non-Owner user cannot perform update on order.",
          code: 403,
        };
      }

      const order = await Order.findOne({
        checkoutId: listingPurchase.checkOutId,
      });
      if (!order) {
        return {
          status: false,
          message: "Invalid order cannot be approved",
          code: 400,
        };
      }

      listingPurchase.paymentConfirmed = true;
      listingPurchase.fulfillmentStatus = data.status;
      if (listingPurchase.fulfillmentStatus === "Approved") {
        listingPurchase.updatedAt = new Date();
      }

      order.status = data.status;
      await order.save({ session });

      listingPurchase = await listingPurchase.save({ session });
      listingPurchase = JSON.parse(JSON.stringify(listingPurchase));
      listingPurchase.cryptoListing.account = await Accounts.findOne({
        _id: listingPurchase.cryptoListing.account,
      });

      if (listingPurchase.fulfillmentStatus === "Approved") {
        //Dispense crypto from crypto escrow account...

        const getPlatformData = () => {
          const platform =
            listingPurchase.cryptoListing.cryptoCurrency.platform;
          return platform;
        };
        const platform = getPlatformData();
        const escrowId = listingPurchase.cryptoListing.escrow;
        const escrowAccount = await Escrow.findOne({ _id: escrowId });
        if (!escrowAccount) {
          throw new Error("No escrow accout was found for this listing");
        }
        if (escrowAccount.availableEscrowBalance < order.amount) {
          throw new Error(
            "No enough stock at this moment to service this order"
          );
        }

        if (
          listingPurchase.cryptoListing.cryptoCurrency.symbol === "ETH" || listingPurchase?.cryptoCode=="ETH"
        ) {
          RegisterNativeETHPayout(listingPurchase, order, escrowId);
        } else if (platform && platform?.symbol === "ETH") {
          RegisterERC20Payout(listingPurchase, order, escrowId, platform);
        } else {
          console.log("⏳ No handler found for payout...");
          throw new Error("No handler found for payout")
        }
      }

      await createStatusUpdateNotification(data.status, listingPurchase);

      await session.commitTransaction();
      session.endSession();
      return {
        status: true,
        message: "Order status was updated successfully",
        data: listingPurchase,
        code: 200,
      };
    }

    return {
      status: false,
      message: "Invalid 'OrderID' in request",
      code: 400,
    };
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const updateBuyerClaim = async (req: Xrequest) => {
  try {
    const accountId: string = req.accountId! as string;
    const data: { status: string; listingPurchaseId: string } = req.body;
    if (!["Paid", "Disputed"].includes(data.status)) {
      return {
        status: false,
        message: "Invalid order status in request",
        code: 400,
      };
    }

    let listingPurchase: any = await CryptoListingPurchase.findOne({
      _id: data.listingPurchaseId,
    })
      .populate("account")
      .populate("cryptoListing");
    if (listingPurchase) {
      // if (listingPurchase.fulfillmentStatus !== "Completed") {
      //   return {
      //     status: false,
      //     message: "An orders must have been completed to Approve or Dispute",
      //     code: 422,
      //   };
      // }
      if (listingPurchase.account._id?.toString() !== accountId) {
        return {
          status: false,
          message:
            "Unauthorized/Non-Owner user cannot perform update on order.",
          code: 403,
        };
      }
      listingPurchase.buyerFulfillmentClaim = data.status;
      listingPurchase = await listingPurchase.save();
      listingPurchase = JSON.parse(JSON.stringify(listingPurchase));
      await createStatusUpdateNotification(data.status, listingPurchase);
      return {
        status: true,
        message: "Order status was updated successfully",
        data: listingPurchase,
        code: 200,
      };
    }
    return {
      status: false,
      message: "Invalid 'OrderID' in request",
      code: 400,
    };
  } catch (error: any) {
    throw error;
  }
};

export const submitOrderComplaint = async (req: Xrequest) => {
  try {
    let account: any = await Accounts.findOne({ _id: req.accountId });
    if (!account) {
      return {
        status: false,
        message: "Account was not found",
        code: 400,
      };
    }

    const reqData = JSON.parse(req.body.message);

    let listingPurchase = await CryptoListingPurchase.findOne({
      checkOutId: reqData.checkOutId,
    });
    if (!listingPurchase) {
      return {
        status: false,
        message: "No order was found for this complaint",
        code: 400,
      };
    }

    let attachment = "";
    if (req?.attachments?.length > 0) {
      attachment = req.attachments[0].replaceAll("/public", "");
    }

    const data = {
      ticketNo: await generateUniqueTicketNumber(),
      checkoutId: reqData.checkOutId,
      message: reqData.message,
      attachment: attachment,
      account: account._id,
      listingPurchase: listingPurchase._id,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const complaint = await Complaint.create(data);
    mailActions.complaints.sendComplaintReceivedMail(account.email, {
      account,
      complaint,
    });
    account = await account.save();
    return {
      status: true,
      data: account,
      message: "Complaint submitted successfully..",
    };
  } catch (error) {
    console.log(error);
    return { status: false, message: "Complaint submission failed.." };
  }
};

function generateComplaintTicketNumber(): string {
  const prefix = "CMP"; // CMP stands for Complaint
  const date = new Date();
  const timestamp = date.getTime().toString(36); // base36 timestamp
  const random = Math.floor(Math.random() * 1e6).toString(36); // base36 random number
  return `${prefix}-${timestamp}-${random}`.toUpperCase();
}

async function generateUniqueTicketNumber(): Promise<string> {
  let unique = false;
  let ticket = "";

  while (!unique) {
    ticket = generateComplaintTicketNumber(); // your generator function
    const existing = await Complaint.findOne({ ticketNo: ticket });
    if (!existing) {
      unique = true;
    }
  }

  return ticket;
}

const createStatusUpdateNotification = async (
  status: string,
  listingPurchase: any
) => {
  //Notification for buyer
  const userId = listingPurchase.account._id;
  await NotificationModel.create({
    user: userId,
    title: `Order status was updated to ${status}`,
    message: `Your order "${listingPurchase?.checkOutId}" for ${listingPurchase.cryptoListing.cryptoName} is now ${status}.`,
    createdAt: new Date(),
    status: "UNREAD",
    class: "success",
    meta: {
      url: `${process.env.CRYGOCA_FRONTEND_BASE_URL!}notifications?uid=${
        listingPurchase._id
      }`,
    },
  });

  const order = await Order.findOne({
    checkoutId: listingPurchase?.checkOutId,
  }).populate("seller");
  if (order) {
    const email: string = listingPurchase.account.email;
    const date = listingPurchase.createdAt.toLocaleString("en-US", {
      weekday: "long", // "Monday"
      year: "numeric", // "2024"
      month: "long", // "December"
      day: "numeric", // "1"
      hour: "2-digit", // "08"
      minute: "2-digit", // "45"
      second: "2-digit", // "32"
      hour12: true, // 12-hour format with AM/PM
    });
    const data: IEmailCheckoutData = {
      checkOutId: listingPurchase?.checkOutId,
      cryptoName: listingPurchase.cryptoListing.cryptoName,
      cryptoCode: listingPurchase.cryptoListing.cryptoCode,
      cryptoLogo: listingPurchase.cryptoListing.cryptoLogo,
      units: listingPurchase.units,
      currency: listingPurchase.cryptoListing?.currency?.toUpperCase(),
      amount: order.toPay,
      walletAddress: listingPurchase.walletAddress,
      buyerUserName: listingPurchase.account.username,
      sellerUserName: order.seller.username,
      paymentOption: listingPurchase.paymentOption,
      date,
      status: status,
    };
    mailActions.orders.sendOrderStatusUpdateMail(email, data);
  }
};
