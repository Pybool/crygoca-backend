"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const liveCrypto_controller_1 = require("../../controllers/v1/liveCrypto.controller");
const jwt_1 = require("../../middlewares/jwt");
const cryptocurrencies_model_1 = __importDefault(require("../../models/cryptocurrencies.model"));
const liveCrypto = express_1.default.Router();
liveCrypto.get("/fetch-live-cryptocurrencies", liveCrypto_controller_1.liveCryptoCurrenciesController.fetchCrypto);
// liveCrypto.get("/get-cryptos", liveCryptoCurrenciesController.getCryptos);
liveCrypto.get("/get-cryptos", liveCrypto_controller_1.liveCryptoCurrenciesController.getSupportedCryptos);
// liveCrypto.post(
//   "/create-crypto-sales-listing",
//   decode,
//   liveCryptoCurrenciesController.createListing
// );
liveCrypto.put("/edit-crypto-sales-listing", jwt_1.decode, liveCrypto_controller_1.liveCryptoCurrenciesController.editListing);
liveCrypto.post("/bookmarking-crypto-sales-listing", jwt_1.decode, liveCrypto_controller_1.liveCryptoCurrenciesController.bookMarkingListing);
liveCrypto.get("/fetch-crypto-sales-listings", jwt_1.decode, liveCrypto_controller_1.liveCryptoCurrenciesController.fetchOrFilterListings);
liveCrypto.post("/archive-crypto-sales-listing", jwt_1.decode, liveCrypto_controller_1.liveCryptoCurrenciesController.archiveListings);
liveCrypto.post("/update-crypto-quotes", async (req, res) => {
    const cryptocurrenciesData = req.body.data;
    for (let cryptocurrency of cryptocurrenciesData) {
        const crypto = await cryptocurrencies_model_1.default.findOne({
            name: cryptocurrency.name,
            symbol: cryptocurrency.symbol,
        });
        if (crypto) {
            crypto.quote = cryptocurrency.quote;
            await crypto.save();
        }
    }
    return res.send({ success: "ok" });
});
exports.default = liveCrypto;
