"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayoutService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const payouts_model_1 = __importDefault(require("../../../models/payouts.model"));
class PayoutService {
    static async getPayOuts(req) {
        try {
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 10;
            const searchText = req.query.searchText || "";
            const userId = req.accountId;
            const skip = (page - 1) * limit;
            // Common aggregation stages
            const commonAggregationStages = [
                {
                    $lookup: {
                        from: "cryptolistingpurchases", // The collection linked to `cryptoListingPurchase`
                        localField: "cryptoListingPurchase",
                        foreignField: "_id",
                        as: "cryptoListingPurchaseDetails",
                    },
                },
                {
                    $unwind: {
                        path: "$cryptoListingPurchaseDetails",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                // Populate cryptoListing field in cryptoListingPurchaseDetails
                {
                    $lookup: {
                        from: "cryptolistings", // Collection for crypto listings
                        localField: "cryptoListingPurchaseDetails.cryptoListing",
                        foreignField: "_id",
                        as: "cryptoListingPurchaseDetails.cryptoListing",
                    },
                },
                {
                    $unwind: {
                        path: "$cryptoListingPurchaseDetails.cryptoListing",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $lookup: {
                        from: "accounts", // The collection linked to `vendorAccount`
                        localField: "vendorAccount",
                        foreignField: "_id",
                        as: "vendorAccountDetails",
                    },
                },
                {
                    $unwind: {
                        path: "$vendorAccountDetails",
                        preserveNullAndEmptyArrays: true,
                    },
                },
            ];
            // Aggregation pipeline for fetching payouts
            const aggregationPipeline = [
                ...commonAggregationStages,
                {
                    $match: {
                        $and: [
                            {
                                vendorAccount: new mongoose_1.default.Types.ObjectId(userId), // Match by userId
                            },
                            {
                                $or: [
                                    { checkOutId: { $regex: new RegExp(searchText, "i") } },
                                    { status: { $regex: new RegExp(searchText, "i") } },
                                    {
                                        "conversionMetaData.currencyFrom": {
                                            $regex: new RegExp(searchText, "i"),
                                        },
                                    },
                                    {
                                        "conversionMetaData.currencyTo": {
                                            $regex: new RegExp(searchText, "i"),
                                        },
                                    },
                                    {
                                        "vendorAccountDetails.username": {
                                            $regex: new RegExp(searchText, "i"),
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                },
                { $sort: { createdAt: -1 } }, // Sort by creation date in descending order
                { $skip: skip }, // Pagination: Skip
                { $limit: limit }, // Pagination: Limit
            ];
            // Run the aggregation pipeline to fetch payouts
            const payouts = await payouts_model_1.default.aggregate(aggregationPipeline);
            // Aggregation pipeline for counting total matching payouts
            const countAggregationPipeline = [
                ...commonAggregationStages,
                {
                    $match: {
                        $and: [
                            {
                                vendorAccount: new mongoose_1.default.Types.ObjectId(userId), // Match by userId
                            },
                            {
                                $or: [
                                    { checkOutId: { $regex: new RegExp(searchText, "i") } },
                                    { status: { $regex: new RegExp(searchText, "i") } },
                                    {
                                        "conversionMetaData.currencyFrom": {
                                            $regex: new RegExp(searchText, "i"),
                                        },
                                    },
                                    {
                                        "conversionMetaData.currencyTo": {
                                            $regex: new RegExp(searchText, "i"),
                                        },
                                    },
                                    {
                                        "vendorAccountDetails.username": {
                                            $regex: new RegExp(searchText, "i"),
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                },
                { $count: "totalCount" },
            ];
            // Run the aggregation pipeline to count payouts
            const totalPayouts = await payouts_model_1.default.aggregate(countAggregationPipeline);
            // Extract the total count
            const totalPayoutsCount = totalPayouts.length > 0 ? totalPayouts[0].totalCount : 0;
            return {
                status: true,
                message: "Payouts fetched successfully",
                data: payouts,
                pagination: {
                    currentPage: page,
                    totalItems: totalPayoutsCount,
                    totalPages: Math.ceil(totalPayoutsCount / limit),
                    itemsPerPage: limit,
                },
                code: 200,
            };
        }
        catch (error) {
            throw error;
        }
    }
}
exports.PayoutService = PayoutService;
