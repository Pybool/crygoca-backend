"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.liveCurrenciesController = void 0;
const liveCurrencies_service_1 = require("../../services/v1/conversions/liveCurrencies.service");
exports.liveCurrenciesController = {
    fetchRates: async (req, res) => {
        try {
            const result = await (0, liveCurrencies_service_1.fetchRates)("https://ng.investing.com/currencies/streaming-forex-rates-majors");
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(422).json(result);
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
};
