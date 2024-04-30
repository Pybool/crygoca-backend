
import express from "express";
import { liveCurrenciesController } from "../../controllers/v1/liveCurrencies.controller";

const liveRates = express.Router();
liveRates.get("/fetch-live-currencies", liveCurrenciesController.fetchRates);

export default liveRates;


