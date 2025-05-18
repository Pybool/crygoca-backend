"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.liveCryptoCurrenciesController = void 0;
const cryptolisting_service_1 = require("../../services/v1/listingsServices/cryptolisting.service");
exports.liveCryptoCurrenciesController = {
    fetchCrypto: async (req, res) => {
        try {
            const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=${req.query.limit}&convert=USD&CMC_PRO_API_KEY=${process.env.COIN_CAP_KEY}`;
            const result = await (0, cryptolisting_service_1.fetchCrypto)(url);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
    getCryptos: async (req, res) => {
        try {
            const result = await (0, cryptolisting_service_1.getCryptos)(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
    getSupportedCryptos: async (req, res) => {
        try {
            const result = await (0, cryptolisting_service_1.getSupportedCryptos)(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
    // createListing: async (
    //   req: Xrequest,
    //   res: Response
    // ) => {
    //   try {
    //     const result = await createListingForSale(req, )
    //     if (result) {
    //       res.status(200).json(result);
    //     } else {
    //       return res.status(422).json(result);
    //     }
    //   } 
    //   catch (error: any) {
    //     res.status(500).json({ status: false, message: error?.message });
    //   }
    // },
    fetchOrFilterListings: async (req, res) => {
        try {
            const result = await (0, cryptolisting_service_1.fetchOrFilterListingsForSale)(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
    archiveListings: async (req, res) => {
        try {
            const result = await (0, cryptolisting_service_1.archiveListings)(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
    editListing: async (req, res) => {
        try {
            const result = await (0, cryptolisting_service_1.editListing)(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
    bookMarkingListing: async (req, res) => {
        try {
            const result = await (0, cryptolisting_service_1.bookMarkingListing)(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
};
