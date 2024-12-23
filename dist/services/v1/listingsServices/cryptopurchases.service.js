"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
exports.updateBuyerClaim = exports.updateStatus = exports.fetchMyOrders = exports.fetchOrders = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const listingPurchase_model_1 = __importStar(require("../../../models/listingPurchase.model"));
const notifications_model_1 = require("../../../models/notifications.model");
const verifiedtransactions_model_1 = __importDefault(require("../../../models/verifiedtransactions.model"));
const mailservice_1 = __importDefault(require("../mail/mailservice"));
const accounts_model_1 = __importDefault(require("../../../models/accounts.model"));
const fetchOrders = (req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const searchText = req.query.searchText || "";
        const userId = req.accountId; // Assuming userId is passed as query parameter
        const skip = (page - 1) * limit;
        // Define common aggregation stages
        const commonAggregationStages = [
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
        ];
        // Define the aggregation pipeline for fetching listings
        const aggregationPipeline = [
            ...commonAggregationStages,
            {
                $match: {
                    $and: [
                        {
                            // Match orders for a specific userId
                            "cryptoListing.account": new mongoose_1.default.Types.ObjectId(userId),
                        },
                        {
                            paymentConfirmed: true,
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
        const orders = yield listingPurchase_model_1.default.aggregate(aggregationPipeline);
        // Define the aggregation pipeline for counting total matching orders
        const countAggregationPipeline = [
            ...commonAggregationStages,
            {
                $match: {
                    $and: [
                        {
                            // Match orders for a specific userId
                            "cryptoListing.account": new mongoose_1.default.Types.ObjectId(userId),
                        },
                        {
                            paymentConfirmed: true,
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
        const totalOrders = yield listingPurchase_model_1.default.aggregate(countAggregationPipeline);
        // Extract the total count from the result
        const totalOrdersCount = totalOrders.length > 0 ? totalOrders[0].totalCount : 0;
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
    }
    catch (error) {
        throw error;
    }
});
exports.fetchOrders = fetchOrders;
const fetchMyOrders = (req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const searchText = req.query.searchText || "";
        const userId = req.accountId; // Assuming userId is passed as query parameter
        const skip = (page - 1) * limit;
        // Define common aggregation stages
        const commonAggregationStages = [
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
        ];
        // Define the aggregation pipeline for fetching listings
        const aggregationPipeline = [
            ...commonAggregationStages,
            {
                $match: {
                    $and: [
                        {
                            // Match orders for a specific userId
                            account: new mongoose_1.default.Types.ObjectId(userId),
                        },
                        {
                            paymentConfirmed: true,
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
        const orders = yield listingPurchase_model_1.default.aggregate(aggregationPipeline);
        // Define the aggregation pipeline for counting total matching orders
        const countAggregationPipeline = [
            ...commonAggregationStages,
            {
                $match: {
                    $and: [
                        {
                            // Match orders for a specific userId
                            account: new mongoose_1.default.Types.ObjectId(userId),
                        },
                        {
                            paymentConfirmed: true,
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
        const totalOrders = yield listingPurchase_model_1.default.aggregate(countAggregationPipeline);
        // Extract the total count from the result
        const totalOrdersCount = totalOrders.length > 0 ? totalOrders[0].totalCount : 0;
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
    }
    catch (error) {
        throw error;
    }
});
exports.fetchMyOrders = fetchMyOrders;
const updateStatus = (req) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const accountId = req.accountId;
        const data = req.body;
        if (!listingPurchase_model_1.orderStatuses.includes(data.status)) {
            return {
                status: false,
                message: "Invalid order status in request",
                code: 400,
            };
        }
        let listingPurchase = yield listingPurchase_model_1.default.findOne({
            _id: data.listingPurchaseId,
        })
            .populate("account")
            .populate("cryptoListing");
        if (listingPurchase) {
            if (!listingPurchase.paymentConfirmed) {
                return {
                    status: false,
                    message: "This order's payment has not yet been confirmed.",
                    code: 422,
                };
            }
            if (((_a = listingPurchase.cryptoListing.account._id) === null || _a === void 0 ? void 0 : _a.toString()) !== accountId) {
                return {
                    status: false,
                    message: "Unauthorized/Non-Owner user cannot perform update on order.",
                    code: 403,
                };
            }
            listingPurchase.fulfillmentStatus = data.status;
            listingPurchase = yield listingPurchase.save();
            listingPurchase = JSON.parse(JSON.stringify(listingPurchase));
            listingPurchase.cryptoListing.account = yield accounts_model_1.default.findOne({
                _id: listingPurchase.cryptoListing.account,
            });
            yield createStatusUpdateNotification(data.status, listingPurchase);
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
    }
    catch (error) {
        throw error;
    }
});
exports.updateStatus = updateStatus;
const updateBuyerClaim = (req) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    try {
        const accountId = req.accountId;
        const data = req.body;
        if (!["Closed", "Disputed"].includes(data.status)) {
            return {
                status: false,
                message: "Invalid order status in request",
                code: 400,
            };
        }
        let listingPurchase = yield listingPurchase_model_1.default.findOne({
            _id: data.listingPurchaseId,
        })
            .populate("account")
            .populate("cryptoListing");
        if (listingPurchase) {
            if (listingPurchase.fulfillmentStatus !== "Completed") {
                return {
                    status: false,
                    message: "An orders must have been completed to Approve or Dispute",
                    code: 422,
                };
            }
            if (((_b = listingPurchase.account._id) === null || _b === void 0 ? void 0 : _b.toString()) !== accountId) {
                return {
                    status: false,
                    message: "Unauthorized/Non-Owner user cannot perform update on order.",
                    code: 403,
                };
            }
            listingPurchase.buyerFulfillmentClaim = data.status;
            listingPurchase = yield listingPurchase.save();
            listingPurchase = JSON.parse(JSON.stringify(listingPurchase));
            yield createStatusUpdateNotification(data.status, listingPurchase);
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
    }
    catch (error) {
        throw error;
    }
});
exports.updateBuyerClaim = updateBuyerClaim;
const createStatusUpdateNotification = (status, listingPurchase) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    //Notification for buyer
    const userId = listingPurchase.account._id;
    yield notifications_model_1.NotificationModel.create({
        user: userId,
        title: `Order ${status}`,
        message: `Your order "${listingPurchase === null || listingPurchase === void 0 ? void 0 : listingPurchase.checkOutId}" for ${listingPurchase.cryptoListing.cryptoName} is now ${status}.`,
        createdAt: new Date(),
        status: "UNREAD",
        class: "success",
        meta: {
            url: `/`,
        },
    });
    const verifiedTransaction = yield verifiedtransactions_model_1.default.findOne({
        tx_ref: listingPurchase === null || listingPurchase === void 0 ? void 0 : listingPurchase.checkOutId,
    });
    if (verifiedTransaction) {
        const email = listingPurchase.account.email;
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
        const data = {
            checkOutId: listingPurchase === null || listingPurchase === void 0 ? void 0 : listingPurchase.checkOutId,
            cryptoName: listingPurchase.cryptoListing.cryptoName,
            cryptoCode: listingPurchase.cryptoListing.cryptoCode,
            cryptoLogo: listingPurchase.cryptoListing.cryptoLogo,
            units: listingPurchase.units,
            currency: (_d = (_c = listingPurchase.cryptoListing) === null || _c === void 0 ? void 0 : _c.currency) === null || _d === void 0 ? void 0 : _d.toUpperCase(),
            amount: verifiedTransaction.data.amount,
            walletAddress: listingPurchase.walletAddress,
            buyerUserName: listingPurchase.account.username,
            sellerUserName: listingPurchase.cryptoListing.account.username,
            paymentOption: listingPurchase.paymentOption,
            date,
            status: status,
        };
        mailservice_1.default.orders.sendOrderStatusUpdateMail(email, data);
    }
});
