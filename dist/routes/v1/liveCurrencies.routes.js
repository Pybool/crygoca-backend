"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const liveCurrencies_controller_1 = require("../../controllers/v1/liveCurrencies.controller");
const liveRates = express_1.default.Router();
liveRates.get("/fetch-live-currencies", liveCurrencies_controller_1.liveCurrenciesController.fetchRates);
exports.default = liveRates;
