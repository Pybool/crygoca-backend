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
const express_1 = __importDefault(require("express"));
const liveCrypto_controller_1 = require("../../controllers/v1/liveCrypto.controller");
const jwt_1 = require("../../middlewares/jwt");
const cryptocurrencies_model_1 = __importDefault(require("../../models/cryptocurrencies.model"));
const liveCrypto = express_1.default.Router();
liveCrypto.get("/fetch-live-cryptocurrencies", liveCrypto_controller_1.liveCryptoCurrenciesController.fetchCrypto);
liveCrypto.get("/get-cryptos", liveCrypto_controller_1.liveCryptoCurrenciesController.getCryptos);
liveCrypto.post("/create-crypto-sales-listing", jwt_1.decode, liveCrypto_controller_1.liveCryptoCurrenciesController.createListing);
liveCrypto.get("/fetch-crypto-sales-listings", jwt_1.decode, liveCrypto_controller_1.liveCryptoCurrenciesController.fetchOrFilterListings);
liveCrypto.post("/update-crypto-quotes", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const cryptocurrenciesData = req.body.data;
    for (let cryptocurrency of cryptocurrenciesData) {
        const crypto = yield cryptocurrencies_model_1.default.findOne({
            name: cryptocurrency.name,
            symbol: cryptocurrency.symbol,
        });
        if (crypto) {
            crypto.quote = cryptocurrency.quote;
            yield crypto.save();
        }
    }
    return res.send({ success: "ok" });
}));
exports.default = liveCrypto;
