import axios from "axios";
import { Cache } from "../../middlewares/cache";
import { response } from "./mockcrypto.response";
import Xrequest from "../../interfaces/extensions.interface";
import CryptoListing, { ISalelisting } from "../../models/saleListing.model";
import CryptoListingPurchase, { IPurchaseSalelisting } from "../../models/listingPurchase.model";
const memCache = new Cache();

export const fetchCrypto = async (url: string, isTask = false) => {
  return new Promise((resolve: any, reject: any) => {
    if (memCache.get("crypto-currencies") && !isTask) {
      console.log(
        memCache.get("crypto-currencies"),
        typeof memCache.get("crypto-currencies")
      );
      resolve(memCache.get("crypto-currencies"));
    } else {
      memCache.set("crypto-currencies", response, 120);
      resolve(response);
      axios
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
};

export const createListingForSale = async (req: Xrequest) => {
  try {
    const payload: ISalelisting = req.body;
    const accountId: string = req.accountId!;

    payload.account = accountId;
    payload.createdAt = new Date();
    payload.updatedAt = new Date();

    const listing = await CryptoListing.create(payload);

    // Populate the 'account' field with data from the Account or User collection
    const populatedListing = await CryptoListing.findById(listing._id).populate('account');

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
    const searchText: string | null = req.query.searchText as string || null;
    
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (searchText) {
      // Case-insensitive search using regular expressions for the fields
      filter.$or = [
        { cryptoName: { $regex: new RegExp(searchText, 'i') } },
        { cryptoCode: { $regex: new RegExp(searchText, 'i') } },
        { currency: { $regex: new RegExp(searchText, 'i') } },
        { cryptoLogo: { $regex: new RegExp(searchText, 'i') } },
        { 'account.username': { $regex: new RegExp(searchText, 'i') } },  // Search inside the username field of account
      ];
    }

    // Fetch listings with sorting, pagination, and population of the 'account' field
    const listings = await CryptoListing.find(filter)
      .skip(skip)  
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate('account');

    // Get total count of listings for pagination info
    const totalListings = await CryptoListing.countDocuments(filter);

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
  } catch (error: any) {
    throw error;
  }
};



export const purchaseListingQuota = async (data:IPurchaseSalelisting) => {
  try {
    const payload: IPurchaseSalelisting = data;
    payload.createdAt = new Date();
    payload.updatedAt = new Date();
    const listing = await CryptoListingPurchase.create(payload);
    return {
      status: true,
      message: `Your purchase was successful, seller has been notified.`,
      data: listing,
      code: 201,
    };
  } catch (error: any) {
    throw error;
  }
};
