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
exports.generateUniqueCode = exports.getListingChanges = exports.updatePaymentConfirmation = exports.purchaseListingQuota = exports.fetchOrFilterListingsForSale = exports.createListingForSale = exports.getCryptos = exports.fetchCrypto = void 0;
const crypto = require("crypto");
const axios_1 = __importDefault(require("axios"));
const cache_1 = require("../../../middlewares/cache");
const mockcrypto_response_1 = require("../mockcrypto.response");
const saleListing_model_1 = __importDefault(require("../../../models/saleListing.model"));
const listingPurchase_model_1 = __importDefault(require("../../../models/listingPurchase.model"));
const cryptocurrencies_model_1 = __importDefault(require("../../../models/cryptocurrencies.model"));
const notifications_model_1 = require("../../../models/notifications.model");
const mailservice_1 = __importDefault(require("../mail/mailservice"));
const verifiedtransactions_model_1 = __importDefault(require("../../../models/verifiedtransactions.model"));
const accounts_model_1 = __importDefault(require("../../../models/accounts.model"));
const memCache = new cache_1.Cache();
const fetchCrypto = (url_1, ...args_1) => __awaiter(void 0, [url_1, ...args_1], void 0, function* (url, isTask = false) {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        const cachedData = yield memCache.get("crypto-currencies");
        if (cachedData && !isTask) {
            console.log(cachedData, typeof cachedData);
            resolve(cachedData);
        }
        else {
            yield memCache.set("crypto-currencies", mockcrypto_response_1.response, 120);
            resolve(mockcrypto_response_1.response);
            axios_1.default
                .get(url)
                .then((_response) => __awaiter(void 0, void 0, void 0, function* () {
                yield memCache.set("crypto-currencies", _response.data, 120);
                resolve(_response.data);
            }))
                .catch((error) => {
                resolve({
                    status: false,
                    data: null,
                    error: error,
                });
            });
        }
    }));
});
exports.fetchCrypto = fetchCrypto;
const getCryptos = (req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const limit = Number(req.query.limit);
        const filter = {};
        // Populate the 'account' field with data from the Account or User collection
        const cryptos = yield cryptocurrencies_model_1.default.find(filter).limit(limit);
        return {
            status: true,
            message: "Top 500 cryptocurrencies fetched",
            data: cryptos,
            code: 200,
        };
    }
    catch (error) {
        throw error;
    }
});
exports.getCryptos = getCryptos;
const createListingForSale = (req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payload = req.body;
        const accountId = req.accountId;
        payload.account = accountId;
        payload.createdAt = new Date();
        payload.updatedAt = new Date();
        const _crypto = yield cryptocurrencies_model_1.default.findOne({
            symbol: payload.cryptoCode,
        });
        if (_crypto) {
            payload.cryptoCurrency = _crypto._id.toString();
        }
        else {
            return {
                status: false,
                message: "We do not currently support this cryptocurrency",
            };
        }
        const listing = yield saleListing_model_1.default.create(payload);
        // Populate the 'account' field with data from the Account or User collection
        const populatedListing = yield saleListing_model_1.default.findById(listing._id).populate("account");
        return {
            status: true,
            message: "Your cryptocurrency has been listed on crygoca",
            data: populatedListing,
            code: 201,
        };
    }
    catch (error) {
        throw error;
    }
});
exports.createListingForSale = createListingForSale;
const fetchOrFilterListingsForSale = (req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const searchText = req.query.searchText || "";
        const skip = (page - 1) * limit;
        // Initialize the filter object
        const filter = {
            $and: [],
        };
        // Case-insensitive search using regular expressions for specific fields
        if (searchText) {
            filter.$and.push({
                $or: [
                    { cryptoName: { $regex: new RegExp(searchText, "i") } },
                    { cryptoCode: { $regex: new RegExp(searchText, "i") } },
                    { currency: { $regex: new RegExp(searchText, "i") } },
                    { cryptoLogo: { $regex: new RegExp(searchText, "i") } },
                ],
            });
        }
        // Ensure units are greater than 0
        filter.$and.push({ units: { $gt: 0 } });
        console.log("Filter ===>", JSON.stringify(filter, null, 2));
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
                $unwind: "$accountDetails", // Unwind accountDetails array
            },
            {
                $lookup: {
                    from: "cryptocurrencies",
                    localField: "cryptoCurrency",
                    foreignField: "_id",
                    as: "cryptoCurrencyDetails",
                },
            },
            {
                $unwind: "$cryptoCurrencyDetails", // Unwind cryptoCurrencyDetails array
            },
        ];
        // Define the aggregation pipeline for fetching listings
        const aggregationPipeline = [
            ...commonAggregationStages,
            { $match: filter }, // Apply the constructed filter
            { $sort: { createdAt: -1 } }, // Sort by creation date (descending)
            { $skip: skip }, // Pagination: Skip
            { $limit: limit }, // Pagination: Limit
        ];
        // Run the aggregation to fetch listings
        const listings = yield saleListing_model_1.default.aggregate(aggregationPipeline);
        // Define the aggregation pipeline for counting total matching listings
        const countAggregationPipeline = [
            ...commonAggregationStages,
            { $match: filter }, // Apply the same filter for counting
            { $count: "totalCount" }, // Count the total matching results
        ];
        // Run the aggregation to count the total matching listings
        const totalListings = yield saleListing_model_1.default.aggregate(countAggregationPipeline);
        // Extract the total count from the result
        const totalListingsCount = totalListings.length > 0 ? totalListings[0].totalCount : 0;
        return {
            status: true,
            message: "Results fetched successfully",
            data: listings,
            pagination: {
                currentPage: page,
                totalItems: totalListingsCount,
                totalPages: Math.ceil(totalListingsCount / limit),
                itemsPerPage: limit,
            },
            code: 200,
        };
    }
    catch (error) {
        throw error;
    }
});
exports.fetchOrFilterListingsForSale = fetchOrFilterListingsForSale;
const purchaseListingQuota = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let listing;
        const payload = data;
        const cryptoListing = yield saleListing_model_1.default.findOne({ _id: payload.cryptoListing });
        if (!cryptoListing) {
            return {
                status: false,
                message: "No crypto listing was found for this request"
            };
        }
        if (!(payload === null || payload === void 0 ? void 0 : payload.checkOutId)) {
            payload.checkOutId = generateUniqueCode();
            payload.createdAt = new Date();
            payload.updatedAt = new Date();
            payload.unitPriceAtPurchaseTime = cryptoListing.unitPrice;
            listing = yield listingPurchase_model_1.default.create(payload);
        }
        else {
            data.updatedAt = new Date();
            listing = yield listingPurchase_model_1.default.findOneAndUpdate({ checkOutId: payload === null || payload === void 0 ? void 0 : payload.checkOutId }, data);
            console.log("Updated checkout in database ===> ", listing);
        }
        return {
            status: true,
            message: `Your purchase was intent was received, make payment to confirm purchase.`,
            data: listing,
            code: 201,
        };
    }
    catch (error) {
        throw error;
    }
});
exports.purchaseListingQuota = purchaseListingQuota;
const createNewSellerPurchaseNotifications = (listingPurchase) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    //Notification for seller
    const userId = listingPurchase.cryptoListing.account._id;
    yield notifications_model_1.NotificationModel.create({
        user: userId,
        title: "New Order",
        message: `You have a new order "${listingPurchase === null || listingPurchase === void 0 ? void 0 : listingPurchase.checkOutId}" for ${listingPurchase.cryptoListing.cryptoName} placed by ${listingPurchase.account.username}`,
        createdAt: new Date(),
        status: "UNREAD",
        class: "info",
        meta: {
            url: `${process.env.WEBSITE_URL}/listing-orders?uid=${listingPurchase._id}`,
        },
    });
    const verifiedTransaction = yield verifiedtransactions_model_1.default.findOne({
        tx_ref: listingPurchase === null || listingPurchase === void 0 ? void 0 : listingPurchase.checkOutId,
    });
    if (verifiedTransaction) {
        const email = listingPurchase.cryptoListing.account.email;
        const date = formatTimestamp(listingPurchase.createdAt);
        const data = {
            checkOutId: listingPurchase === null || listingPurchase === void 0 ? void 0 : listingPurchase.checkOutId,
            cryptoName: listingPurchase.cryptoListing.cryptoName,
            cryptoCode: listingPurchase.cryptoListing.cryptoCode,
            cryptoLogo: listingPurchase.cryptoListing.cryptoLogo,
            units: listingPurchase.units,
            currency: (_b = (_a = listingPurchase.cryptoListing) === null || _a === void 0 ? void 0 : _a.currency) === null || _b === void 0 ? void 0 : _b.toUpperCase(),
            amount: verifiedTransaction.data.amount,
            walletAddress: listingPurchase.walletAddress,
            buyerUserName: listingPurchase.account.username,
            sellerUserName: listingPurchase.cryptoListing.account.username,
            paymentOption: listingPurchase.paymentOption,
            date
        };
        mailservice_1.default.orders.sendSellerOrderReceivedMail(email, data);
    }
});
const createNewBuyerPurchaseNotifications = (listingPurchase) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d;
    //Notification for buyer
    const userId = listingPurchase.account._id;
    yield notifications_model_1.NotificationModel.create({
        user: userId,
        title: "Order Successful",
        message: `You order "${listingPurchase === null || listingPurchase === void 0 ? void 0 : listingPurchase.checkOutId}" for ${listingPurchase.cryptoListing.cryptoName} was successful. The seller has been notified.`,
        createdAt: new Date(),
        status: "UNREAD",
        class: "success",
        meta: {
            url: `${process.env.WEBSITE_URL}/listing-orders?uid=${listingPurchase._id}`,
        },
    });
    const verifiedTransaction = yield verifiedtransactions_model_1.default.findOne({
        tx_ref: listingPurchase === null || listingPurchase === void 0 ? void 0 : listingPurchase.checkOutId,
    });
    if (verifiedTransaction) {
        const email = listingPurchase.account.email;
        const date = listingPurchase.createdAt.toLocaleString('en-US', {
            weekday: 'long', // "Monday"
            year: 'numeric', // "2024"
            month: 'long', // "December"
            day: 'numeric', // "1"
            hour: '2-digit', // "08"
            minute: '2-digit', // "45"
            second: '2-digit', // "32"
            hour12: true // 12-hour format with AM/PM
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
            date
        };
        mailservice_1.default.orders.sendBuyerOrderReceivedMail(email, data);
    }
});
const updatePaymentConfirmation = (tx_ref) => __awaiter(void 0, void 0, void 0, function* () {
    let listingPurchase = yield listingPurchase_model_1.default.findOne({
        checkOutId: tx_ref,
    })
        .populate("account")
        .populate("cryptoListing");
    if (listingPurchase) {
        listingPurchase.paymentConfirmed = true;
        listingPurchase.fulfillmentStatus = "Pending";
        yield listingPurchase.save();
        listingPurchase = JSON.parse(JSON.stringify(listingPurchase));
        listingPurchase.cryptoListing.account = yield accounts_model_1.default.findOne({
            _id: listingPurchase.cryptoListing.account,
        });
        console.log("Notifcations cryptoListing ", listingPurchase.cryptoListing);
        yield createNewSellerPurchaseNotifications(listingPurchase);
        yield createNewBuyerPurchaseNotifications(listingPurchase);
    }
});
exports.updatePaymentConfirmation = updatePaymentConfirmation;
const getListingChanges = (listing) => __awaiter(void 0, void 0, void 0, function* () {
    let cryptoListing = yield saleListing_model_1.default.findOne({
        _id: listing._id,
        units: { $gte: listing.unitsToPurchase },
    })
        .populate("account") // Populate the 'account' field as 'accountDetails'
        .populate("cryptoCurrency");
    if (cryptoListing) {
        const changes = [];
        if (listing.currency !== cryptoListing.currency) {
            changes.push({ currency: cryptoListing.currency });
        }
        if (listing.unitPrice !== cryptoListing.unitPrice) {
            changes.push({ unitPrice: cryptoListing.unitPrice });
        }
        if (listing.minUnits !== cryptoListing.minUnits) {
            changes.push({ minUnits: cryptoListing.minUnits });
        }
        if (changes.length == 0) {
            return {
                status: true,
                message: "No changes detected on crypto listing",
            };
        }
        cryptoListing = JSON.parse(JSON.stringify(cryptoListing));
        cryptoListing.accountDetails = cryptoListing.account;
        cryptoListing.cryptoCurrencyDetails = cryptoListing.cryptoCurrency;
        delete cryptoListing.account;
        delete cryptoListing.cryptoCurrency;
        return {
            status: true,
            message: `This version of this listing is no longer valid, changes we detected on vital fields`,
            data: {
                changes,
                cryptoListing,
            },
        };
    }
    else {
        return {
            status: false,
            message: "This listing may be out of stock or no longer exists",
        };
    }
});
exports.getListingChanges = getListingChanges;
// Helper method to generate a random alphanumeric string of a given length
function generateRandomString(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        const randomValue = randomBytes[i] % characters.length;
        result += characters[randomValue];
    }
    return result;
}
function generateUniqueCode() {
    const prefix = "CR-";
    const randomString = generateRandomString(8);
    const timestamp = Date.now().toString(36).slice(-4);
    return (prefix + randomString + timestamp).toUpperCase();
}
exports.generateUniqueCode = generateUniqueCode;
function formatTimestamp(timestamp) {
    // Create a Date object from the given timestamp
    const date = new Date(timestamp);
    // Define the formatting options
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true, // To use 12-hour format with AM/PM
    };
    // Create a formatter with the given options
    const formatter = new Intl.DateTimeFormat('en-US', options);
    // Format and return the date
    return formatter.format(date);
}
