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
Object.defineProperty(exports, "__esModule", { value: true });
exports.liveCryptoCurrenciesController = void 0;
const cryptolisting_service_1 = require("../../services/v1/listingsServices/cryptolisting.service");
exports.liveCryptoCurrenciesController = {
    fetchCrypto: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=${req.query.limit}&convert=USD&CMC_PRO_API_KEY=${process.env.COIN_CAP_KEY}`;
            const result = yield (0, cryptolisting_service_1.fetchCrypto)(url);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error === null || error === void 0 ? void 0 : error.message });
        }
    }),
    getCryptos: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield (0, cryptolisting_service_1.getCryptos)(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error === null || error === void 0 ? void 0 : error.message });
        }
    }),
    getSupportedCryptos: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield (0, cryptolisting_service_1.getSupportedCryptos)(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error === null || error === void 0 ? void 0 : error.message });
        }
    }),
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
    fetchOrFilterListings: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield (0, cryptolisting_service_1.fetchOrFilterListingsForSale)(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error === null || error === void 0 ? void 0 : error.message });
        }
    }),
    archiveListings: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield (0, cryptolisting_service_1.archiveListings)(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error === null || error === void 0 ? void 0 : error.message });
        }
    }),
    editListing: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield (0, cryptolisting_service_1.editListing)(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error === null || error === void 0 ? void 0 : error.message });
        }
    }),
    bookMarkingListing: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield (0, cryptolisting_service_1.bookMarkingListing)(req);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error === null || error === void 0 ? void 0 : error.message });
        }
    }),
};
