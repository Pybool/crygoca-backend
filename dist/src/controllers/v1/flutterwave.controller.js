"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flutterWaveController = void 0;
const flutterwave_service_1 = require("../../services/v1/payments/flutterwave.service");
const googlePay_service_1 = require("../../services/v1/payments/googlePay.service");
exports.flutterWaveController = {
    initiateCardPayment: async (req, res) => {
        try {
            const result = await flutterwave_service_1.FlutterWaveService.initiateCardPayment(req);
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
    verifyCardPayment: async (req, res) => {
        try {
            const result = await flutterwave_service_1.FlutterWaveService.verifyCardPayment(req.body);
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
    initiateACHPayment: async (req, res) => {
        try {
            const result = await flutterwave_service_1.FlutterWaveService.initiateACHPayment(req);
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
    initiateGooglePayPayment: async (req, res) => {
        try {
            const result = await googlePay_service_1.GooglePayService.makeGooglePayCharge(req);
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
    googlePayTokenizedCharge: async (req, res) => {
        try {
            const result = await googlePay_service_1.GooglePayService.googlePayTokenizedCharge(req);
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
