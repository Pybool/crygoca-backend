"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookMarkingListing = exports.editListing = exports.archiveListings = exports.getListingChanges = exports.updatePaymentConfirmation = exports.purchaseListingQuota = exports.fetchOrFilterListingsForSale = exports.createListingForSale = exports.updatePlatforms = exports.getSupportedCryptos = exports.getCryptos = exports.fetchCrypto = void 0;
const axios_1 = __importDefault(require("axios"));
const cache_1 = require("../../../middlewares/cache");
const mockcrypto_response_1 = require("../mockcrypto.response");
const saleListing_model_1 = __importDefault(require("../../../models/saleListing.model"));
const listingPurchase_model_1 = __importDefault(require("../../../models/listingPurchase.model"));
const cryptocurrencies_model_1 = __importDefault(require("../../../models/cryptocurrencies.model"));
const helpers_1 = require("../helpers");
const paymentVerificationQueue_1 = require("../jobs/payment-verification/paymentVerificationQueue");
const mongoose_1 = __importDefault(require("mongoose"));
const saleListingBookmark_model_1 = __importDefault(require("../../../models/saleListingBookmark.model"));
const tokens_config_1 = require("../../../escrow/config/tokens.config");
const memCache = new cache_1.Cache();
const fetchCrypto = async (url, isTask = false) => {
    return new Promise(async (resolve, reject) => {
        const cachedData = await memCache.get("crypto-currencies");
        if (cachedData && !isTask) {
            console.log(cachedData, typeof cachedData);
            resolve(cachedData);
        }
        else {
            await memCache.set("crypto-currencies", mockcrypto_response_1.response, 120);
            resolve(mockcrypto_response_1.response);
            axios_1.default
                .get(url)
                .then(async (_response) => {
                await memCache.set("crypto-currencies", _response.data, 120);
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
};
exports.fetchCrypto = fetchCrypto;
const getCryptos = async (req) => {
    try {
        const limit = Number(req.query.limit);
        const searchQuery = req.query.q || ""; // Replace with user input
        const filter = {
            $or: [
                { name: { $regex: searchQuery, $options: "i" } },
                { symbol: { $regex: searchQuery, $options: "i" } },
                { slug: { $regex: searchQuery, $options: "i" } },
                { tags: { $regex: searchQuery, $options: "i" } },
            ],
        };
        // Populate the 'account' field with data from the Account or User collection
        const cryptos = await cryptocurrencies_model_1.default.find(filter).limit(limit);
        return {
            status: true,
            message: "Cryptocurrencies fetched",
            data: cryptos,
            code: 200,
        };
    }
    catch (error) {
        throw error;
    }
};
exports.getCryptos = getCryptos;
const getSupportedCryptos = async (req) => {
    try {
        const limit = Number(req.query.limit);
        const searchQuery = req.query.q || "";
        // Step 1: Prepare allowed symbols (lowercase)
        const allowedSymbols = [
            ...tokens_config_1.ERC20_TOKENS.map((token) => token.symbol.toLowerCase()),
            ...tokens_config_1.NATIVE_CRYPTO.map((crypto) => crypto.symbol.toLowerCase()),
        ];
        const filter = {
            $and: [
                {
                    $or: [
                        { name: { $regex: searchQuery, $options: "i" } },
                        { symbol: { $regex: searchQuery, $options: "i" } },
                        { slug: { $regex: searchQuery, $options: "i" } },
                        { tags: { $regex: searchQuery, $options: "i" } },
                    ],
                },
                {
                    $expr: {
                        $in: [
                            { $toLower: "$symbol" }, // convert document symbol to lowercase
                            allowedSymbols,
                        ],
                    },
                },
            ],
        };
        // Step 3: Query MongoDB
        const cryptos = await cryptocurrencies_model_1.default.find(filter); //.limit(limit);
        return {
            status: true,
            message: "Cryptocurrencies fetched",
            data: cryptos,
            code: 200,
        };
    }
    catch (error) {
        throw error;
    }
};
exports.getSupportedCryptos = getSupportedCryptos;
const updatePlatforms = async () => {
    let updated = 0;
    const cryptos = await cryptocurrencies_model_1.default.find({
        "platform.symbol": "ETH",
        platform: { $ne: null },
    });
    for (let crypto of cryptos) {
        const token = tokens_config_1.ERC20_TOKENS.find((token) => token.symbol.toLowerCase() === crypto.symbol?.toLowerCase());
        if (token && token.chainId == 1) {
            crypto.platform = {
                chainId: 1,
                name: "Ethereum",
                symbol: "ETH",
                slug: "ethereum",
            };
            crypto.address = token.address;
            crypto.decimals = token.decimals;
            crypto.chainId = token.chainId;
            crypto.logo2 = token.logoURI;
            await crypto.save();
            updated++;
        }
    }
    console.log(`Updated ${updated} cryptocurrencies with Ethereum platform.`);
};
exports.updatePlatforms = updatePlatforms;
const createListingForSale = async (req, session) => {
    try {
        const payload = req.body;
        const accountId = req.accountId;
        payload.account = accountId;
        payload.createdAt = new Date();
        payload.updatedAt = new Date();
        payload.depositConfirmed = false;
        const _crypto = await cryptocurrencies_model_1.default.findOne({
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
        const listing = await saleListing_model_1.default.create([payload], { session });
        // Populate the 'account' field with data from the Account or User collection
        const populatedListing = await saleListing_model_1.default.findById(listing[0]._id).populate(["account", "cryptoCurrency"]);
        return {
            status: true,
            data: populatedListing,
            code: 201,
        };
    }
    catch (error) {
        throw error;
    }
};
exports.createListingForSale = createListingForSale;
const fetchOrFilterListingsForSale = async (req) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const searchText = req.query.searchText || "";
        let searchGroup = req.query.searchGroup || "";
        if (searchGroup) {
            searchGroup = searchGroup.replace("group:", "");
        }
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
        filter.$and.push({ depositConfirmed: true });
        if (searchGroup === "owner") {
            filter.$and.push({
                account: new mongoose_1.default.Types.ObjectId(req.accountId),
            });
        }
        if (searchGroup === "crygoca") {
            filter.$and.push({
                isCrygoca: true,
            });
        }
        if (searchGroup === "bookmarks") {
            const bookmarkedListings = await saleListingBookmark_model_1.default.find({
                account: req.accountId,
            }).select("cryptoListing");
            const bookmarkedIds = bookmarkedListings.map((b) => new mongoose_1.default.Types.ObjectId(b.cryptoListing));
            filter.$and.push({ _id: { $in: bookmarkedIds } });
        }
        if (req.query.minPrice && req.query.maxPrice) {
            const minPrice = Number(req.query.minPrice);
            const maxPrice = Number(req.query.maxPrice);
            const priceSearchSymbol = req.query.priceSearchSymbol || null;
            if (isNaN(minPrice) || isNaN(maxPrice)) {
                return {
                    status: false,
                    message: "minPrice and maxPrice must be valid numbers",
                };
            }
            if (minPrice > maxPrice) {
                return {
                    status: false,
                    message: "minPrice cannot be greater than maxPrice",
                };
            }
            if (priceSearchSymbol) {
                filter.$and.push({ cryptoCode: priceSearchSymbol });
            }
            // Add price range filter
            filter.$and.push({ unitPrice: { $gte: minPrice, $lte: maxPrice } });
        }
        // Ensure units are greater than 0
        filter.$and.push({ units: { $gt: 0 } });
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
            {
                $lookup: {
                    from: "escrows",
                    localField: "escrow",
                    foreignField: "_id",
                    as: "escrow",
                },
            },
            {
                $unwind: "$escrow", // Unwind cryptoCurrencyDetails array
                // preserveNullAndEmptyArrays: true
            },
            // {
            //   $match: {
            //     isArchived: { $ne: true }, // Exclude listings where isArchived is true
            //   },
            // },
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
        const listings = await saleListing_model_1.default.aggregate(aggregationPipeline);
        // Define the aggregation pipeline for counting total matching listings
        const countAggregationPipeline = [
            ...commonAggregationStages,
            { $match: filter }, // Apply the same filter for counting
            { $count: "totalCount" }, // Count the total matching results
        ];
        // Run the aggregation to count the total matching listings
        const totalListings = await saleListing_model_1.default.aggregate(countAggregationPipeline);
        // Extract the total count from the result
        const totalListingsCount = totalListings.length > 0 ? totalListings[0].totalCount : 0;
        for (let listing of listings) {
            const exists = await saleListingBookmark_model_1.default.findOne({
                cryptoListing: listing?._id,
                account: req.accountId,
            });
            listing.isBookMarked = exists !== null;
            if (searchGroup === "bookmarks" && listing.isBookMarked) {
                listing.updatedAt = exists?.createdAt;
            }
        }
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
};
exports.fetchOrFilterListingsForSale = fetchOrFilterListingsForSale;
const purchaseListingQuota = async (data) => {
    try {
        let listing;
        const payload = data;
        const cryptoListing = await saleListing_model_1.default.findOne({
            _id: payload.cryptoListing,
        });
        if (!cryptoListing) {
            return {
                status: false,
                message: "No crypto listing was found for this request",
            };
        }
        if (payload.units > cryptoListing.units) {
            return {
                status: false,
                message: "You are ordering more units than are avaialble at this time.",
            };
        }
        if (!payload?.checkOutId) {
            payload.checkOutId = (0, helpers_1.generateReferenceCode)();
            payload.createdAt = new Date();
            payload.updatedAt = new Date();
            payload.unitPriceAtPurchaseTime = cryptoListing.unitPrice;
            listing = await listingPurchase_model_1.default.create(payload);
        }
        else {
            data.updatedAt = new Date();
            listing = await listingPurchase_model_1.default.findOneAndUpdate({ checkOutId: payload?.checkOutId }, data);
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
};
exports.purchaseListingQuota = purchaseListingQuota;
const updatePaymentConfirmation = async (tx_ref) => {
    console.log("Updating Payment confirmation ===> ", tx_ref);
    await paymentVerificationQueue_1.paymentVerificationQueue.add("process-payment", { tx_ref }, { attempts: 2, backoff: 5000 });
    console.log("Verification job added to the queue.");
    return {
        status: true,
        message: "Your order's payment is being processed.",
    };
};
exports.updatePaymentConfirmation = updatePaymentConfirmation;
const getListingChanges = async (listing) => {
    let cryptoListing = await saleListing_model_1.default.findOne({
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
};
exports.getListingChanges = getListingChanges;
const archiveListings = async (req) => {
    try {
        const { listingId, action } = req.body;
        if (!["archive", "unarchive"].includes(action)) {
            return {
                status: false,
                message: `${action} is not a valid parameter for this operation`,
                code: 400,
            };
        }
        const isArchived = action === "archive"; // Set isArchived based on action
        const listing = await saleListing_model_1.default.findOneAndUpdate({ _id: listingId }, { isArchived }, // Update isArchived dynamically
        { new: true });
        if (!listing) {
            return {
                status: false,
                message: "Listing not found",
                code: 404,
            };
        }
        return {
            status: true,
            message: `Listing successfully ${action}d.`,
            data: listing,
        };
    }
    catch (error) {
        throw error;
    }
};
exports.archiveListings = archiveListings;
const editListing = async (req) => {
    try {
        const payload = req.body;
        const accountId = req.accountId;
        const updatedListing = await saleListing_model_1.default.findOneAndUpdate({ _id: payload._id }, payload, { new: true }).populate(["account", "cryptoCurrency"]);
        return {
            status: true,
            message: "Your listing has been updated on crygoca",
            data: updatedListing,
            code: 200,
        };
    }
    catch (error) {
        throw error;
    }
};
exports.editListing = editListing;
const bookMarkingListing = async (req) => {
    try {
        const { listingId, action } = req.body;
        const accountId = req.accountId;
        const listing = await saleListing_model_1.default.findOne({
            _id: listingId,
            isArchived: false,
        });
        if (!listing) {
            return {
                status: false,
                message: "No listing was found or listing may have been archived",
            };
        }
        if (action === "bookmark") {
            const exists = await saleListingBookmark_model_1.default.findOne({
                cryptoListing: listingId,
                account: accountId,
            });
            if (exists) {
                return {
                    status: false,
                    message: "You have already bookmarked this listing.",
                };
            }
            const bookmark = await saleListingBookmark_model_1.default.create({
                cryptoListing: listingId,
                account: accountId,
                createdAt: new Date(),
            });
            return {
                status: true,
                message: "Bookmarked successfully",
                data: bookmark,
                code: 200,
            };
        }
        if (action === "unbookmark") {
            await saleListingBookmark_model_1.default.findOneAndDelete({
                cryptoListing: listingId,
                account: accountId,
            });
            return {
                status: true,
                message: "Unbookmarked successfully",
                data: null,
                code: 200,
            };
        }
        return {
            status: false,
            message: "Operation was not successful",
            code: 200,
        };
    }
    catch (error) {
        throw error;
    }
};
exports.bookMarkingListing = bookMarkingListing;
