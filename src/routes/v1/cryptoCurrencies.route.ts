
import express from "express";
import { liveCryptoCurrenciesController } from "../../controllers/v1/liveCrypto.controller";

const liveCrypto = express.Router();
liveCrypto.get("/fetch-live-cryptocurrencies", liveCryptoCurrenciesController.fetchCrypto);

export default liveCrypto;


