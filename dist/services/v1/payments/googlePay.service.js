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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GooglePayService = void 0;
const axios_1 = __importDefault(require("axios"));
class GooglePayService {
    static makeGooglePayCharge(req) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const url = "https://api.flutterwave.com/v3/charges?type=googlepay";
            const secretKey = process.env.FLW_SECRET_KEY; // Replace with your actual secret key
            const payload = req.body;
            try {
                const response = yield axios_1.default.post(url, payload, {
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
                    console.error("Axios Error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
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
        });
    }
}
exports.GooglePayService = GooglePayService;
