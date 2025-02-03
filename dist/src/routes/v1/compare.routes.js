"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const compare_controller_1 = require("../../controllers/v1/compare.controller");
const compareRoute = express_1.default.Router();
compareRoute.post("/compare", compare_controller_1.compareController.compareExchangeProviders);
compareRoute.post("/convert", compare_controller_1.compareController.convertCurrency);
compareRoute.get("/get-country", compare_controller_1.compareController.getUserCountry);
exports.default = compareRoute;
