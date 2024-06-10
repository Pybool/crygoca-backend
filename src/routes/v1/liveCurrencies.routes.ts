
import express from "express";
import { liveCurrenciesController } from "../../controllers/v1/liveCurrencies.controller";

const liveRates = express.Router();
liveRates.get("/fetch-live-currencies", liveCurrenciesController.fetchRates);

export default liveRates;

// https://api.currencyapi.com/v3/latest?apikey=cur_live_d52M3q2XMNDurG4Q7kHtSr3P5iqTsNWpUtF5kcNx&currencies=NGN&base_currency=GBP

// https://api.currencyapi.com/v3/latest?apikey=cur_live_d52M3q2XMNDurG4Q7kHtSr3P5iqTsNWpUtF5kcNx&currencies=NGN


