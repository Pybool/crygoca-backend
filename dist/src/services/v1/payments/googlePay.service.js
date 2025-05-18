"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GooglePayService = void 0;
const axios_1 = __importDefault(require("axios"));
const mock_service_1 = require("./mock.service");
const helpers_1 = require("../helpers");
class GooglePayService {
    static async makeGooglePayCharge(req) {
        const url = "https://api.flutterwave.com/v3/charges?type=googlepay";
        const secretKey = process.env.FLW_SECRET_KEY; // Replace with your actual secret key
        const payload = req.body;
        try {
            const response = await axios_1.default.post(url, payload, {
                headers: {
                    Authorization: `Bearer ${secretKey}`,
                    "Content-Type": "application/json",
                },
            });
            console.log("Payment Response:", response.data);
            return {
                status: true,
                data: response.data,
            };
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                console.error("Axios Error:", error.response?.data || error.message);
                /* Development simulation... */
                if (process.env.MOCK_VERIFICATION_RESPONSE == 'true') {
                    const googlePayChargeSuccessResponse = mock_service_1.googlePayChargeSuccess;
                    googlePayChargeSuccessResponse.data.tx_ref = payload.tx_ref;
                    googlePayChargeSuccessResponse.data.amount = payload.amount;
                    googlePayChargeSuccessResponse.data.charged_amount = payload.amount;
                    googlePayChargeSuccessResponse.data.currency = payload.currency;
                    googlePayChargeSuccessResponse.data.customer.email = payload.email;
                    googlePayChargeSuccessResponse.data.customer.name = payload.fullname;
                    googlePayChargeSuccessResponse.data.created_at = new Date();
                    return {
                        status: true,
                        data: mock_service_1.googlePayChargeSuccess
                    };
                }
                return {
                    status: false,
                    message: "Failed to create charge",
                };
            }
            else {
                console.error("Unexpected Error:", error);
                return {
                    status: false,
                    message: "Failed to create charge",
                };
            }
        }
    }
    static async googlePayTokenizedCharge(req) {
        const url = "https://api.flutterwave.com/v3/charges?type=googlepay";
        const secretKey = process.env.FLW_SECRET_KEY; // Replace with your actual secret key
        const payload = req.body;
        payload.tx_ref = (0, helpers_1.generateReferenceCode)();
        try {
            const response = await axios_1.default.post(url, payload, {
                headers: {
                    Authorization: `Bearer ${secretKey}`,
                    "Content-Type": "application/json",
                },
            });
            console.log("Payment Response:", response.data);
            return {
                status: true,
                data: response.data,
            };
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                console.error("Axios Error:", error.response?.data || error.message);
                return {
                    status: false,
                    message: "Failed to create charge",
                };
            }
            else {
                console.error("Unexpected Error:", error);
                return {
                    status: false,
                    message: "Failed to create charge",
                };
            }
        }
    }
}
exports.GooglePayService = GooglePayService;
