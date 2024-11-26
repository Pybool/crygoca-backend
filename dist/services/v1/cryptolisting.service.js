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
exports.purchaseListingQuota = exports.fetchOrFilterListingsForSale = exports.createListingForSale = exports.fetchCrypto = void 0;
const axios_1 = __importDefault(require("axios"));
const cache_1 = require("../../middlewares/cache");
const mockcrypto_response_1 = require("./mockcrypto.response");
const saleListing_model_1 = __importDefault(require("../../models/saleListing.model"));
const listingPurchase_model_1 = __importDefault(require("../../models/listingPurchase.model"));
const memCache = new cache_1.Cache();
const fetchCrypto = (url_1, ...args_1) => __awaiter(void 0, [url_1, ...args_1], void 0, function* (url, isTask = false) {
    return new Promise((resolve, reject) => {
        if (memCache.get("crypto-currencies") && !isTask) {
            console.log(memCache.get("crypto-currencies"), typeof memCache.get("crypto-currencies"));
            resolve(memCache.get("crypto-currencies"));
        }
        else {
            memCache.set("crypto-currencies", mockcrypto_response_1.response, 120);
            resolve(mockcrypto_response_1.response);
            axios_1.default
                .get(url)
                .then((_response) => {
                memCache.set("crypto-currencies", _response.data, 120);
                resolve(_response.data);
            })
                .catch((error) => {
                resolve({
                    status: false,
                    data: null,
                    error: error,
                });
            });
        }
    });
});
exports.fetchCrypto = fetchCrypto;
const createListingForSale = (req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payload = req.body;
        const accountId = req.accountId;
        payload.account = accountId;
        payload.createdAt = new Date();
        payload.updatedAt = new Date();
        const listing = yield saleListing_model_1.default.create(payload);
        // Populate the 'account' field with data from the Account or User collection
        const populatedListing = yield saleListing_model_1.default.findById(listing._id).populate('account');
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
        const searchText = req.query.searchText || null;
        const skip = (page - 1) * limit;
        const filter = {};
        if (searchText) {
            // Case-insensitive search using regular expressions for the fields
            filter.$or = [
                { cryptoName: { $regex: new RegExp(searchText, 'i') } },
                { cryptoCode: { $regex: new RegExp(searchText, 'i') } },
                { currency: { $regex: new RegExp(searchText, 'i') } },
                { cryptoLogo: { $regex: new RegExp(searchText, 'i') } },
                { 'account.username': { $regex: new RegExp(searchText, 'i') } }, // Search inside the username field of account
            ];
        }
        // Fetch listings with sorting, pagination, and population of the 'account' field
        const listings = yield saleListing_model_1.default.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .populate('account');
        // Get total count of listings for pagination info
        const totalListings = yield saleListing_model_1.default.countDocuments(filter);
        return {
            status: true,
            message: "Results fetched successfully",
            data: listings,
            pagination: {
                currentPage: page,
                totalItems: totalListings,
                totalPages: Math.ceil(totalListings / limit),
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
        const payload = data;
        payload.createdAt = new Date();
        payload.updatedAt = new Date();
        const listing = yield listingPurchase_model_1.default.create(payload);
        return {
            status: true,
            message: `Your purchase was successful, seller has been notified.`,
            data: listing,
            code: 201,
        };
    }
    catch (error) {
        throw error;
    }
});
exports.purchaseListingQuota = purchaseListingQuota;
