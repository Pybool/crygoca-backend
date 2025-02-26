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
exports.flutterWaveController = void 0;
const flutterwave_service_1 = require("../../services/v1/payments/flutterwave.service");
const googlePay_service_1 = require("../../services/v1/payments/googlePay.service");
exports.flutterWaveController = {
    initiateCardPayment: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield flutterwave_service_1.FlutterWaveService.initiateCardPayment(req);
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
    verifyCardPayment: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield flutterwave_service_1.FlutterWaveService.verifyCardPayment(req.body);
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
    initiateACHPayment: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield flutterwave_service_1.FlutterWaveService.initiateACHPayment(req);
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
    initiateGooglePayPayment: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield googlePay_service_1.GooglePayService.makeGooglePayCharge(req);
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
    googlePayTokenizedCharge: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const result = yield googlePay_service_1.GooglePayService.googlePayTokenizedCharge(req);
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
