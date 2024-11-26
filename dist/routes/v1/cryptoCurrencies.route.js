"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const liveCrypto_controller_1 = require("../../controllers/v1/liveCrypto.controller");
const jwt_1 = require("../../middlewares/jwt");
const liveCrypto = express_1.default.Router();
liveCrypto.get("/fetch-live-cryptocurrencies", liveCrypto_controller_1.liveCryptoCurrenciesController.fetchCrypto);
liveCrypto.post("/create-crypto-sales-listing", jwt_1.decode, liveCrypto_controller_1.liveCryptoCurrenciesController.createListing);
liveCrypto.get("/fetch-crypto-sales-listings", jwt_1.decode, liveCrypto_controller_1.liveCryptoCurrenciesController.fetchOrFilterListings);
exports.default = liveCrypto;
