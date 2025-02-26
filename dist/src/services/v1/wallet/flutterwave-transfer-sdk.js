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
exports.CrygocaFlutterwaveSdk = void 0;
class CrygocaFlutterwaveSdk {
    // Constructor to accept and store the secret key
    constructor(secretKey) {
        if (!secretKey) {
            throw new Error("Secret key is required to initialize the SDK.");
        }
        this.secretKey = secretKey;
    }
    // Method to make transfer
    makeTransfer(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = "https://api.flutterwave.com/v3/transfers";
            return yield this.makeRequest(url, payload);
        });
    }
    retryTransfer(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://api.flutterwave.com/v3/transfers/${id}/retries`;
            return yield this.makeRequest(url);
        });
    }
    getTransfer(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = `https://api.flutterwave.com/v3/transfers/${id}`;
            return yield this.makeGetRequest(url);
        });
    }
    makeGetRequest(endpoint) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(endpoint, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.secretKey}`, // Use the secret key
                    }
                });
                if (!response.ok) {
                    const error = yield response.json();
                    throw new Error(`Failed to fetch transfer: ${error.message || response.statusText}`);
                }
                return yield response.json();
            }
            catch (error) {
                console.error("Error while making request:", error);
                throw error;
            }
        });
    }
    // Private utility function to make HTTP requests
    makeRequest(endpoint, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.secretKey}`, // Use the secret key
                    },
                    body: JSON.stringify(data || {}),
                });
                if (!response.ok) {
                    const error = yield response.json();
                    throw new Error(`Failed to make transfer: ${error.message || response.statusText}`);
                }
                return yield response.json();
            }
            catch (error) {
                console.error("Error while making request:", error);
                throw error;
            }
        });
    }
}
exports.CrygocaFlutterwaveSdk = CrygocaFlutterwaveSdk;
