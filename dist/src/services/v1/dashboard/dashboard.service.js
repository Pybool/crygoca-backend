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
exports.DashboardService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const listingPurchase_model_1 = __importDefault(require("../../../models/listingPurchase.model"));
const payouts_model_1 = __importDefault(require("../../../models/payouts.model"));
const accounts_model_1 = __importDefault(require("../../../models/accounts.model"));
const referralrewards_model_1 = __importDefault(require("../../../models/referralrewards.model"));
const verifiedtransactions_model_1 = __importDefault(require("../../../models/verifiedtransactions.model"));
const countries_1 = require("../../../models/countries");
const comparison_service_1 = require("../conversions/comparison.service");
const dashboard_wallet_service_1 = require("./dashboard-wallet.service");
function calculatePercentageChange(data) {
    var _a, _b;
    // Set missing keys to 0 if they are not present
    const forward = (_a = data.resultForward) !== null && _a !== void 0 ? _a : 0;
    const backward = (_b = data.resultBackward) !== null && _b !== void 0 ? _b : 0;
    // Avoid division by zero if backward is zero
    if (backward === 0) {
        return 0; // Return 0 if division by zero occurs
    }
    // Calculate the percentage change
    const percentageChange = ((forward - backward) / backward) * 100;
    return percentageChange;
}
class DashboardService {
    static getImmediatelyVisibleData(req) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const totalSales = yield DashboardService.getTotalSalesData(req);
                const totalEarnings = yield DashboardService.getTotalEarningsData(req);
                const totalPurchaseSpend = yield DashboardService.getPurchaseSpendData(req);
                const totalDisputesCount = yield DashboardService.getPendingDisputesCount(req);
                const totalPendingOrdersCount = yield DashboardService.getPendingOrdersData(req);
                const referralsData = yield DashboardService.getReferralsData(req);
                const popularCryptoData = yield DashboardService.getPopularsData();
                const recentTransactions = yield DashboardService.getRecentTransactions(req);
                const accountDateFilter = DashboardService.getAccountDateFilter(req);
                const walletStatistics = yield DashboardService.fetchWalletTransactionData(req);
                return {
                    status: true,
                    data: {
                        totalSales,
                        totalEarnings,
                        totalDisputesCount,
                        totalPendingOrdersCount,
                        totalPurchaseSpend,
                        referralsData,
                        popularCryptoData,
                        recentTransactions: recentTransactions,
                        accountDateFilter,
                        walletStatistics
                    },
                };
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    static fetchSalesTimelineData(req) {
        return __awaiter(this, void 0, void 0, function* () {
            /* Immediately visible are the top 3 cards, referral data and graph */
            try {
                const totalSales = yield DashboardService.getTotalSalesData(req);
                const accountDateFilter = DashboardService.getAccountDateFilter(req);
                return {
                    status: true,
                    data: {
                        totalSales,
                        accountDateFilter,
                    },
                };
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    static fetchEarningsTimelineData(req) {
        return __awaiter(this, void 0, void 0, function* () {
            /* Immediately visible are the top 3 cards, referral data and graph */
            try {
                const totalEarnings = yield DashboardService.getTotalEarningsData(req);
                const accountDateFilter = DashboardService.getAccountDateFilter(req);
                return {
                    status: true,
                    data: {
                        totalEarnings,
                        accountDateFilter,
                    },
                };
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    static fetchPurchaseSpendTimelineData(req) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const totalPurchaseSpend = yield DashboardService.getPurchaseSpendData(req);
                const accountDateFilter = DashboardService.getAccountDateFilter(req);
                return {
                    status: true,
                    data: {
                        totalPurchaseSpend,
                        accountDateFilter,
                    },
                };
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    static getCenterVisibleData(req) {
        return __awaiter(this, void 0, void 0, function* () {
            /* Immediately visible are the 3 popular cards, sell order and buy order */
            try {
            }
            catch (error) { }
        });
    }
    static getAccountDateFilter(req) {
        const accountId = req.accountId || req.query.accountId;
        const timePeriod = req.query.timePeriod || "all";
        const now = new Date();
        let currentStartDate = null;
        let currentEndDate = now;
        let backwardStartDate = null;
        let backwardEndDate = null;
        if (timePeriod === "today") {
            // Current: Start and end of today
            currentStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            backwardStartDate = new Date(currentStartDate);
            backwardStartDate.setDate(currentStartDate.getDate() - 1); // Yesterday
            backwardEndDate = new Date(currentStartDate);
        }
        else if (timePeriod === "thisWeek") {
            // Current: Start and end of the current week
            const currentWeekDay = now.getDay(); // 0 (Sun) to 6 (Sat)
            currentStartDate = new Date(now);
            currentStartDate.setDate(now.getDate() - currentWeekDay);
            currentStartDate.setHours(0, 0, 0, 0);
            backwardStartDate = new Date(currentStartDate);
            backwardStartDate.setDate(currentStartDate.getDate() - 7); // Start of last week
            backwardEndDate = new Date(backwardStartDate);
            backwardEndDate.setDate(backwardStartDate.getDate() + 6); // End of last week
        }
        else if (timePeriod === "thisMonth") {
            // Current: Start and end of the current month
            currentStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
            backwardStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            backwardEndDate = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of the previous month
        }
        const dateFilter = {
            forward: currentStartDate && currentEndDate
                ? { $gte: currentStartDate, $lte: currentEndDate }
                : {},
            backward: backwardStartDate && backwardEndDate
                ? { $gte: backwardStartDate, $lte: backwardEndDate }
                : {},
        };
        let period = "All Time";
        if (timePeriod === "today") {
            period = "Today";
        }
        else if (timePeriod === "thisWeek") {
            period = "Last 7 Days";
        }
        else if (timePeriod === "thisMonth") {
            period = "Since 30 Days";
        }
        return {
            accountId,
            dateFilter,
            period,
        };
    }
    static getTotalSalesData(req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            const accountDateFilter = DashboardService.getAccountDateFilter(req);
            const accountId = accountDateFilter.accountId;
            const dateFilterBackWard = accountDateFilter.dateFilter.backward;
            const dateFilterForWard = accountDateFilter.dateFilter.forward;
            const commonAggregationStages = [
                {
                    $lookup: {
                        from: "cryptolistings",
                        localField: "cryptoListing",
                        foreignField: "_id",
                        as: "cryptoListing",
                    },
                },
                {
                    $unwind: "$cryptoListing", // Unwind cryptoListing array
                },
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
                        preserveNullAndEmptyArrays: true, // Optional: include entries even if there is no match for accountDetails
                    },
                },
            ];
            const getPipeline = (_dateFilter) => {
                const pipeline = [
                    ...commonAggregationStages,
                    {
                        $match: {
                            $and: [
                                {
                                    // Match orders for a specific accountId
                                    "cryptoListing.accountDetails._id": new mongoose_1.default.Types.ObjectId(accountId),
                                },
                                {
                                    fulfillmentStatus: "Completed",
                                },
                                {
                                    buyerFulfillmentClaim: "Closed",
                                },
                            ].filter(Boolean),
                        },
                    },
                    {
                        $addFields: {
                            sales: {
                                $multiply: ["$units", "$unitPriceAtPurchaseTime"], // Compute sales per purchase
                            },
                        },
                    },
                    {
                        $facet: {
                            totalSales: [
                                {
                                    $group: {
                                        _id: null, // Group all documents
                                        totalSales: { $sum: "$sales" }, // Sum up the sales
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $project: {
                            purchases: 1,
                            totalSales: { $arrayElemAt: ["$totalSales.totalSales", 0] }, // Extract totalSales value
                        },
                    },
                ];
                // Conditionally add the createdAt filter if the timePeriod query is present
                if (req.query.timePeriod) {
                    pipeline[pipeline.length - 4].$match.$and.push({
                        createdAt: _dateFilter, // Apply the date filter dynamically
                    });
                }
                return {
                    aggregationPipeline: pipeline,
                };
            };
            const pipelineBackward = getPipeline(dateFilterBackWard).aggregationPipeline;
            const pipelineForward = getPipeline(dateFilterForWard).aggregationPipeline;
            const resultBackward = yield listingPurchase_model_1.default.aggregate(pipelineBackward);
            const resultForward = yield listingPurchase_model_1.default.aggregate(pipelineForward);
            const account = yield accounts_model_1.default.findOne({ _id: accountId });
            if (!account) {
                return null;
            }
            const currencyTo = ((_a = account.geoData.currency) === null || _a === void 0 ? void 0 : _a.code) || 'USD';
            const currencyFrom = "USD";
            const from = (0, countries_1.getCountryCodeByCurrencyCode)(currencyFrom.toUpperCase()).code;
            const to = (0, countries_1.getCountryCodeByCurrencyCode)(currencyTo.toUpperCase()).code;
            console.log(from, to, currencyFrom, currencyTo);
            const convertToDefaultCurrency = (amount) => __awaiter(this, void 0, void 0, function* () {
                if (from && to && currencyFrom && currencyTo) {
                    return yield (0, comparison_service_1.convertCurrency)(from, to, currencyFrom, currencyTo, amount === null || amount === void 0 ? void 0 : amount.toString());
                }
                return null;
            });
            const exchangeRateData = yield convertToDefaultCurrency(1);
            const exchangeRate = ((_c = (_b = exchangeRateData === null || exchangeRateData === void 0 ? void 0 : exchangeRateData.data) === null || _b === void 0 ? void 0 : _b.data[currencyTo]) === null || _c === void 0 ? void 0 : _c.value) || 1;
            console.log("exchangeRate ===> ", exchangeRate);
            console.log("Sales ====> ", (resultForward[0] || { purchases: [], totalSales: 0 })
                .totalSales);
            const convertedResultForward = (resultForward[0] || { purchases: [], totalSales: 0 })
                .totalSales * exchangeRate;
            const convertedResultBackward = (resultBackward[0] || { purchases: [], totalSales: 0 })
                .totalSales * exchangeRate;
            let activeCurrency = null;
            if (!((_e = (_d = exchangeRateData === null || exchangeRateData === void 0 ? void 0 : exchangeRateData.data) === null || _d === void 0 ? void 0 : _d.data[currencyTo]) === null || _e === void 0 ? void 0 : _e.value)) {
                activeCurrency = currencyFrom;
            }
            const results = {
                resultForward: convertedResultForward,
                resultBackward: convertedResultBackward,
                activeCurrency: activeCurrency
            };
            results.percentageChange = calculatePercentageChange(results);
            return results;
        });
    }
    static getTotalEarningsData(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const accountDateFilter = DashboardService.getAccountDateFilter(req);
            const accountId = accountDateFilter.accountId;
            const dateFilterBackWard = accountDateFilter.dateFilter.backward;
            const dateFilterForWard = accountDateFilter.dateFilter.forward;
            const forwardMatch = {
                vendorAccount: new mongoose_1.default.Types.ObjectId(accountId),
            };
            const backwardMatch = {
                vendorAccount: new mongoose_1.default.Types.ObjectId(accountId),
            };
            if (req.query.timePeriod) {
                forwardMatch.createdAt = dateFilterForWard;
                backwardMatch.createdAt = dateFilterBackWard;
            }
            const earningsbackwards = yield payouts_model_1.default.aggregate([
                {
                    $match: backwardMatch,
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: "$payout" },
                    },
                },
            ]);
            const earningsForwards = yield payouts_model_1.default.aggregate([
                {
                    $match: forwardMatch,
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: "$payout" },
                    },
                },
            ]);
            const results = {
                resultForward: earningsForwards.length > 0 ? earningsForwards[0].totalAmount : 0,
                resultBackward: earningsbackwards.length > 0 ? earningsbackwards[0].totalAmount : 0,
            };
            results.percentageChange = calculatePercentageChange(results);
            return results;
        });
    }
    static getPendingDisputesCount(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const accountDateFilter = DashboardService.getAccountDateFilter(req);
            const accountId = accountDateFilter.accountId;
            const commonAggregationStages = [
                {
                    $lookup: {
                        from: "cryptolistings",
                        localField: "cryptoListing",
                        foreignField: "_id",
                        as: "cryptoListing",
                    },
                },
                {
                    $unwind: "$cryptoListing", // Unwind cryptoListing array
                },
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
                        preserveNullAndEmptyArrays: true, // Optional: include entries even if there is no match for accountDetails
                    },
                },
            ];
            const countAggregationPipeline = [
                ...commonAggregationStages,
                {
                    $match: {
                        $and: [
                            {
                                // Match orders for a specific accountId
                                "cryptoListing.accountDetails._id": new mongoose_1.default.Types.ObjectId(accountId),
                            },
                            {
                                buyerFulfillmentClaim: "Disputed",
                            },
                            // dateFilter, // Apply the date filter dynamically
                        ].filter(Boolean),
                    },
                },
                { $count: "totalCount" },
            ];
            const disputesCount = yield listingPurchase_model_1.default.aggregate(countAggregationPipeline);
            return disputesCount.length > 0 ? disputesCount[0].totalCount : 0;
        });
    }
    static getReferralsData(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const accountDateFilter = DashboardService.getAccountDateFilter(req);
            const accountId = accountDateFilter.accountId;
            const account = yield accounts_model_1.default.findOne({ _id: accountId });
            if (!account) {
                return {
                    status: false,
                    message: "Unauthorized user",
                };
            }
            const totalRewardAmount = yield referralrewards_model_1.default.aggregate([
                {
                    $match: { referralCode: account.referralCode },
                },
                {
                    $group: {
                        _id: null,
                        totalRewardAmount: { $sum: "$rewardAmount" },
                    },
                },
            ]);
            // If there are matching records, the totalRewardAmount will be in the first element
            return {
                totalEarning: totalRewardAmount.length > 0
                    ? totalRewardAmount[0].totalRewardAmount
                    : 0,
                totalJoined: account.referralCount,
                referralCode: account.referralCode,
            };
        });
    }
    static getChartsData(req) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    static getPopularsData() {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            // Helper function to compute start and end dates
            const getDateRange = (timePeriod) => {
                let startDate;
                let endDate = now;
                if (timePeriod === "today") {
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
                }
                else if (timePeriod === "thisWeek") {
                    const currentWeekDay = now.getDay(); // 0 (Sunday) to 6 (Saturday)
                    startDate = new Date(now);
                    startDate.setDate(now.getDate() - currentWeekDay); // Start of the week
                    startDate.setHours(0, 0, 0, 0);
                }
                else if (timePeriod === "thisMonth") {
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Start of the month
                }
                else {
                    throw new Error("Invalid time period");
                }
                return { startDate, endDate };
            };
            const buildPipeline = (timePeriod) => {
                const { startDate, endDate } = getDateRange(timePeriod);
                return [
                    {
                        $match: {
                            createdAt: { $gte: startDate, $lte: endDate }, // Filter by date range
                            paymentConfirmed: true,
                        },
                    },
                    {
                        $group: {
                            _id: "$cryptoListing", // Group by the cryptoListing field
                            count: { $sum: 1 }, // Count occurrences
                        },
                    },
                    {
                        $sort: { count: -1 }, // Sort by count in descending order
                    },
                    {
                        $limit: 1, // Get the most popular item
                    },
                    {
                        $lookup: {
                            from: "cryptolistings", // Collection name for CryptoListing
                            localField: "_id", // Field in the current collection
                            foreignField: "_id", // Field in the CryptoListing collection
                            as: "cryptoDetails", // Output field for populated data
                        },
                    },
                    {
                        $unwind: {
                            path: "$cryptoDetails", // Unwind the array to simplify access
                            preserveNullAndEmptyArrays: true,
                        },
                    },
                    {
                        $project: {
                            _id: 0,
                            cryptoListing: "$cryptoDetails", // Rename the populated field
                            count: 1,
                        },
                    },
                ];
            };
            const [mostPopularCryptoListingToday] = yield listingPurchase_model_1.default.aggregate(buildPipeline("today"));
            const [mostPopularCryptoListingThisWeek] = yield listingPurchase_model_1.default.aggregate(buildPipeline("thisWeek"));
            const [mostPopularCryptoListingThisMonth] = yield listingPurchase_model_1.default.aggregate(buildPipeline("thisMonth"));
            return {
                today: mostPopularCryptoListingToday || { cryptoListing: null, count: 0 },
                thisWeek: mostPopularCryptoListingThisWeek || {
                    cryptoListing: null,
                    count: 0,
                },
                thisMonth: mostPopularCryptoListingThisMonth || {
                    cryptoListing: null,
                    count: 0,
                },
            };
        });
    }
    static getPurchaseSpendData(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const accountDateFilter = DashboardService.getAccountDateFilter(req);
            const accountId = accountDateFilter.accountId;
            const dateFilterBackWard = accountDateFilter.dateFilter.backward;
            const dateFilterForWard = accountDateFilter.dateFilter.forward;
            const grouping = {
                $group: {
                    _id: null,
                    totalPurchaseSpend: { $sum: "$data.charged_amount" },
                },
            };
            const match = {
                $match: {
                    $and: [{ account: new mongoose_1.default.Types.ObjectId(accountId) }].filter(Boolean),
                },
            };
            const setAndgetMatch = (_dateFilter) => {
                if (req.query.timePeriod) {
                    const lastCondition = match.$match.$and[match.$match.$and.length - 1];
                    if (lastCondition && lastCondition.createdAt !== undefined) {
                        lastCondition.createdAt = _dateFilter;
                    }
                    else {
                        match.$match.$and.push({
                            createdAt: _dateFilter,
                        });
                    }
                }
                return match;
            };
            const totalPurchaseSpendForward = yield verifiedtransactions_model_1.default.aggregate([
                setAndgetMatch(dateFilterForWard),
                grouping,
            ]);
            const totalPurchaseSpendBackward = yield verifiedtransactions_model_1.default.aggregate([
                setAndgetMatch(dateFilterBackWard),
                grouping,
            ]);
            const results = {
                resultForward: totalPurchaseSpendForward.length > 0
                    ? totalPurchaseSpendForward[0].totalPurchaseSpend
                    : 0,
                resultBackward: totalPurchaseSpendBackward.length > 0
                    ? totalPurchaseSpendBackward[0].totalPurchaseSpend
                    : 0,
            };
            results.percentageChange = calculatePercentageChange(results);
            return results;
        });
    }
    static getPendingOrdersData(req) {
        return __awaiter(this, void 0, void 0, function* () {
            const accountDateFilter = DashboardService.getAccountDateFilter(req);
            const accountId = accountDateFilter.accountId;
            const commonAggregationStages = [
                {
                    $lookup: {
                        from: "cryptolistings",
                        localField: "cryptoListing",
                        foreignField: "_id",
                        as: "cryptoListing",
                    },
                },
                {
                    $unwind: "$cryptoListing", // Unwind cryptoListing array
                },
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
                        preserveNullAndEmptyArrays: true, // Optional: include entries even if there is no match for accountDetails
                    },
                },
            ];
            const countAggregationPipeline = [
                ...commonAggregationStages,
                {
                    $match: {
                        $and: [
                            {
                                // Match orders for a specific accountId
                                "cryptoListing.accountDetails._id": new mongoose_1.default.Types.ObjectId(accountId),
                            },
                            {
                                fulfillmentStatus: "Pending",
                            },
                            // dateFilter, // Apply the date filter dynamically
                        ].filter(Boolean),
                    },
                },
                { $count: "totalCount" },
            ];
            const pendingOrdersCount = yield listingPurchase_model_1.default.aggregate(countAggregationPipeline);
            return pendingOrdersCount.length > 0 ? pendingOrdersCount[0].totalCount : 0;
        });
    }
    static getRecentTransactions(req) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const accountId = req.accountId;
                let recentTransactions = yield listingPurchase_model_1.default.find({
                    account: accountId,
                    paymentConfirmed: true,
                })
                    .populate({
                    path: "cryptoListing",
                    populate: {
                        path: "account",
                        select: "avatar username provider",
                    },
                })
                    .sort({ createdAt: -1 })
                    .limit(5);
                recentTransactions = JSON.parse(JSON.stringify(recentTransactions));
                for (let recentTransaction of recentTransactions) {
                    let payment = yield verifiedtransactions_model_1.default.findOne({
                        tx_ref: recentTransaction.checkOutId,
                    }).select("data");
                    recentTransaction.payment = payment;
                }
                return recentTransactions;
            }
            catch (error) {
                return null;
            }
        });
    }
    static fetchWalletTransactionData(req) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const accountId = req.accountId;
                const timePeriod = req.query.timePeriod || 'daily';
                const operationType = req.query.operationType || 'credit';
                const walletStatistics = yield dashboard_wallet_service_1.DashboardWalletService.fetchWalletTransactionData(accountId, operationType, timePeriod);
                return walletStatistics;
            }
            catch (error) {
                return null;
            }
        });
    }
}
exports.DashboardService = DashboardService;
