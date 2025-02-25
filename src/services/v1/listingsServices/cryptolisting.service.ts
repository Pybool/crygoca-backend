import axios from "axios";
import { Cache } from "../../../middlewares/cache";
import { response } from "../mockcrypto.response";
import Xrequest from "../../../interfaces/extensions.interface";
import CryptoListing, { ISalelisting } from "../../../models/saleListing.model";
import CryptoListingPurchase, {
  IPurchaseSalelisting,
} from "../../../models/listingPurchase.model";
import Cryptocurrencies from "../../../models/cryptocurrencies.model";
import { NotificationModel } from "../../../models/notifications.model";
import mailActions, { IEmailCheckoutData } from "../mail/mailservice";
import VerifiedTransactions from "../../../models/verifiedtransactions.model";
import Accounts from "../../../models/accounts.model";
import { formatTimestamp, generateReferenceCode } from "../helpers";
import { paymentVerificationQueue } from "../jobs/payment-verification/paymentVerificationQueue";
const memCache = new Cache();

export const fetchCrypto = async (url: string, isTask = false) => {
  return new Promise(async (resolve: any, reject: any) => {
    const cachedData = await memCache.get("crypto-currencies");
    if (cachedData && !isTask) {
      console.log(cachedData, typeof cachedData);
      resolve(cachedData);
    } else {
      await memCache.set("crypto-currencies", response, 120);
      resolve(response);
      axios
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

export const getCryptos = async (req: Xrequest) => {
  try {
    const limit: number = Number(req.query.limit! as string);
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
    const cryptos = await Cryptocurrencies.find(filter).limit(limit);

    return {
      status: true,
      message: "Cryptocurrencies fetched",
      data: cryptos,
      code: 200,
    };
  } catch (error: any) {
    throw error;
  }
};

export const createListingForSale = async (req: Xrequest) => {
  try {
    const payload: ISalelisting = req.body;
    const accountId: string = req.accountId!;

    payload.account = accountId;
    payload.createdAt = new Date();
    payload.updatedAt = new Date();
    const _crypto = await Cryptocurrencies.findOne({
      symbol: payload.cryptoCode,
    });
    if (_crypto) {
      payload.cryptoCurrency = _crypto._id.toString();
    } else {
      return {
        status: false,
        message: "We do not currently support this cryptocurrency",
      };
    }

    const listing = await CryptoListing.create(payload);

    // Populate the 'account' field with data from the Account or User collection
    const populatedListing = await CryptoListing.findById(listing._id).populate(
      "account"
    );

    return {
      status: true,
      message: "Your cryptocurrency has been listed on crygoca",
      data: populatedListing,
      code: 201,
    };
  } catch (error: any) {
    throw error;
  }
};

export const fetchOrFilterListingsForSale = async (req: Xrequest) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const searchText: string = (req.query.searchText as string) || "";

    const skip = (page - 1) * limit;

    // Initialize the filter object
    const filter: any = {
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

    console.log("Filter ===>", JSON.stringify(filter, null, 2));

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
    const aggregationPipeline: any = [
      ...commonAggregationStages,
      { $match: filter }, // Apply the constructed filter
      { $sort: { createdAt: -1 } }, // Sort by creation date (descending)
      { $skip: skip }, // Pagination: Skip
      { $limit: limit }, // Pagination: Limit
    ];

    // Run the aggregation to fetch listings
    const listings = await CryptoListing.aggregate(aggregationPipeline);

    // Define the aggregation pipeline for counting total matching listings
    const countAggregationPipeline = [
      ...commonAggregationStages,
      { $match: filter }, // Apply the same filter for counting
      { $count: "totalCount" }, // Count the total matching results
    ];

    // Run the aggregation to count the total matching listings
    const totalListings = await CryptoListing.aggregate(
      countAggregationPipeline
    );

    // Extract the total count from the result
    const totalListingsCount =
      totalListings.length > 0 ? totalListings[0].totalCount : 0;

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
  } catch (error: any) {
    throw error;
  }
};

export const purchaseListingQuota = async (data: IPurchaseSalelisting) => {
  try {
    let listing: any;
    const payload: IPurchaseSalelisting = data;
    const cryptoListing = await CryptoListing.findOne({
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
      payload.checkOutId = generateReferenceCode();
      payload.createdAt = new Date();
      payload.updatedAt = new Date();
      payload.unitPriceAtPurchaseTime = cryptoListing.unitPrice;
      listing = await CryptoListingPurchase.create(payload);
    } else {
      data.updatedAt = new Date();
      listing = await CryptoListingPurchase.findOneAndUpdate(
        { checkOutId: payload?.checkOutId },
        data
      );
      console.log("Updated checkout in database ===> ", listing);
    }

    return {
      status: true,
      message: `Your purchase was intent was received, make payment to confirm purchase.`,
      data: listing,
      code: 201,
    };
  } catch (error: any) {
    throw error;
  }
};

export const updatePaymentConfirmation = async (tx_ref: string) => {
  console.log("Updating Payment confirmation ===> ", tx_ref);
  await paymentVerificationQueue.add(
    "process-payment",
    { tx_ref },
    { attempts: 2, backoff: 5000 }
  );
  console.log("Verification job added to the queue.");
  return {
    status: true,
    message: "Your order's payment is being processed.",
  };
};

export const getListingChanges = async (listing: any) => {
  let cryptoListing: any = await CryptoListing.findOne({
    _id: listing._id,
    units: { $gte: listing.unitsToPurchase },
  })
    .populate("account") // Populate the 'account' field as 'accountDetails'
    .populate("cryptoCurrency");
  if (cryptoListing) {
    const changes: any[] = [];

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
  } else {
    return {
      status: false,
      message: "This listing may be out of stock or no longer exists",
    };
  }
};
