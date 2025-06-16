"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const liveCrypto_controller_1 = require("../../controllers/v1/liveCrypto.controller");
const jwt_1 = require("../../middlewares/jwt");
const cryptocurrencies_model_1 = __importDefault(require("../../models/cryptocurrencies.model"));
const convert_crypto_1 = require("../../helpers/convert-crypto");
const liveCrypto = express_1.default.Router();
liveCrypto.get("/fetch-live-cryptocurrencies", liveCrypto_controller_1.liveCryptoCurrenciesController.fetchCrypto);
// liveCrypto.get("/get-cryptos", liveCryptoCurrenciesController.getCryptos);
liveCrypto.get("/get-cryptos", liveCrypto_controller_1.liveCryptoCurrenciesController.getSupportedCryptos);
liveCrypto.get("/crypto-conversion", liveCrypto_controller_1.liveCryptoCurrenciesController.cryptoConversion);
liveCrypto.get('/exchange-prices', liveCrypto_controller_1.liveCryptoCurrenciesController.exchangePrices);
liveCrypto.put("/edit-crypto-sales-listing", jwt_1.decode, liveCrypto_controller_1.liveCryptoCurrenciesController.editListing);
liveCrypto.post("/bookmarking-crypto-sales-listing", jwt_1.decode, liveCrypto_controller_1.liveCryptoCurrenciesController.bookMarkingListing);
liveCrypto.get("/fetch-crypto-sales-listings", jwt_1.decode, liveCrypto_controller_1.liveCryptoCurrenciesController.fetchOrFilterListings);
liveCrypto.post("/archive-crypto-sales-listing", jwt_1.decode, liveCrypto_controller_1.liveCryptoCurrenciesController.archiveListings);
liveCrypto.get("/convert-crypto-to-crypto", async (req, res) => {
    const { from, to, amount } = req.query;
    if (!from || !to || !amount) {
        return res.status(400).json({ error: "Missing 'from', 'to', or 'amount' in query params." });
    }
    try {
        const result = await (0, convert_crypto_1.convertCryptoToCrypto)(from, to, amount);
        return res.json({ success: true, conversion: result });
    }
    catch (err) {
        console.error("Conversion error:", err.message);
        return res.status(500).json({ error: "Internal server error" });
    }
});
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
