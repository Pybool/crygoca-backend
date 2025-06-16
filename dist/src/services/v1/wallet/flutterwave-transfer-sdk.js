"use strict";
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
    async makeTransfer(payload) {
        const url = "https://api.flutterwave.com/v3/transfers";
        return await this.makeRequest(url, payload);
    }
    async retryTransfer(id) {
        const url = `https://api.flutterwave.com/v3/transfers/${id}/retries`;
        return await this.makeRequest(url);
    }
    async getTransfer(id) {
        const url = `https://api.flutterwave.com/v3/transfers/${id}`;
        return await this.makeGetRequest(url);
    }
    async makeGetRequest(endpoint) {
        try {
            const response = await fetch(endpoint, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.secretKey}`, // Use the secret key
                }
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Failed to fetch transfer: ${error.message || response.statusText}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error("Error while making request:", error);
            throw error;
        }
    }
    // Private utility function to make HTTP requests
    async makeRequest(endpoint, data) {
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.secretKey}`, // Use the secret key
                },
                body: JSON.stringify(data || {}),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Failed to make transfer: ${error.message || response.statusText}`);
            }
            return await response.json();
        }
        catch (error) {
            console.error("Error while making request:", error);
            throw error;
        }
    }
}
exports.CrygocaFlutterwaveSdk = CrygocaFlutterwaveSdk;
