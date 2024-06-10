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
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareController = void 0;
const comparison_service_1 = require("../../services/v1/comparison.service");
exports.compareController = {
    compareExchangeProviders: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const compare = req.query.compare;
            const { from, to, currencyFrom, currencyTo, amount } = req.body;
            const result = yield (0, comparison_service_1.compareExchangeProviders)(from, to, currencyFrom, currencyTo, amount, compare);
            if (result.status) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error === null || error === void 0 ? void 0 : error.message });
        }
    }),
    getUserCountry: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield (0, comparison_service_1.getUserCountry)(req);
            if (result) {
                res.status(200).json({ status: true, data: result });
            }
            else {
                return res.status(404).json({ status: false, data: result });
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error === null || error === void 0 ? void 0 : error.message });
        }
    }),
};
