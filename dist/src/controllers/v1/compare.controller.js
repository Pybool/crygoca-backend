"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareController = void 0;
const comparison_service_1 = require("../../services/v1/conversions/comparison.service");
exports.compareController = {
    compareExchangeProviders: async (req, res) => {
        try {
            const compare = req.query.compare;
            const { from, to, currencyFrom, currencyTo, amount } = req.body;
            const result = await (0, comparison_service_1.compareExchangeProviders)(from, to, currencyFrom, currencyTo, amount, compare);
            if (result.status) {
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
    getUserCountry: async (req, res) => {
        try {
            const result = await (0, comparison_service_1.getUserCountry)(req);
            if (result) {
                res.status(200).json({ status: true, data: result });
            }
            else {
                return res.status(404).json({ status: false, data: result });
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
    convertCurrency: async (req, res) => {
        try {
            const { from, to, currencyFrom, currencyTo, amount } = req.body;
            const result = await (0, comparison_service_1.convertCurrency)(from, to, currencyFrom, currencyTo, amount);
            if (result) {
                res.status(200).json(result);
            }
            else {
                return res.status(404).json({ status: false, data: result });
            }
        }
        catch (error) {
            res.status(500).json({ status: false, message: error?.message });
        }
    },
};
