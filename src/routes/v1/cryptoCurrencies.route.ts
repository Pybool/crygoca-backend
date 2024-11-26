import express from "express";
import { liveCryptoCurrenciesController } from "../../controllers/v1/liveCrypto.controller";
import { decode } from "../../middlewares/jwt";

const liveCrypto = express.Router();
liveCrypto.get(
  "/fetch-live-cryptocurrencies",
  liveCryptoCurrenciesController.fetchCrypto
);

liveCrypto.post(
  "/create-crypto-sales-listing",
  decode,
  liveCryptoCurrenciesController.createListing
);

liveCrypto.get(
  "/fetch-crypto-sales-listings",
  decode,
  liveCryptoCurrenciesController.fetchOrFilterListings
);

export default liveCrypto;
