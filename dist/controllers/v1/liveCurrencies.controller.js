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
exports.liveCurrenciesController = void 0;
const liveCurrencies_service_1 = require("../../services/v1/liveCurrencies.service");
exports.liveCurrenciesController = {
    fetchRates: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield (0, liveCurrencies_service_1.fetchRates)("https://ng.investing.com/currencies/streaming-forex-rates-majors");
            if (result) {
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
};
