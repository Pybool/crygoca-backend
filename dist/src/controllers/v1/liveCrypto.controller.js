"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.liveCryptoCurrenciesController = void 0;
const cryptolisting_service_1 = require("../../services/v1/listingsServices/cryptolisting.service");
const axios_1 = __importDefault(require("axios"));
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
    cryptoConversion: async (req, res) => {
        const { from, to, amount } = req.query;
        if (!from || !to || !amount) {
            return res
                .status(400)
                .json({ status: false, message: "Missing required parameters" });
        }
        try {
            const coinLayerUrl = `https://api.coinlayer.com/convert?access_key=${process
                .env.COINLAYER_API_KEY}&from=${from}&to=${to}&amount=${amount}`;
            const response = await axios_1.default.get(coinLayerUrl);
            const result = response.data;
            if (result && result.success) {
                return res.status(200).json(result);
            }
            else {
                return res.status(422).json({
                    status: false,
                    message: result?.error?.info || "Conversion failed",
                    error: result,
                });
            }
        }
        catch (error) {
            return res.status(500).json({
                status: false,
                message: error?.response?.data?.error?.info || error.message,
            });
        }
    },
    getExchangePrices: async (req, res) => {
        const { symbol } = req.query;
        if (!symbol) {
            return res
                .status(400)
                .json({ status: false, message: "Symbol is required" });
        }
        try {
            const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/market-pairs/latest?symbol=${symbol}`;
            const response = await axios_1.default.get(url, {
                headers: {
                    "X-CMC_PRO_API_KEY": process.env.COIN_CAP_KEY,
                    Accept: "application/json",
                },
            });
            const result = response.data;
            if (result && result.status?.error_code === 0) {
                return res.status(200).json(result);
            }
            else {
                return res.status(422).json({
                    status: false,
                    message: result.status?.error_message || "Failed to fetch exchange prices",
                    error: result,
                });
            }
        }
        catch (error) {
            return res.status(500).json({
                status: false,
                message: error?.response?.data?.status?.error_message || error.message,
            });
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
