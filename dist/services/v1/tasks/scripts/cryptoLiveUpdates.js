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
exports.cryptoLiveUpdates = void 0;
const axios = require("axios");
const dotenv_1 = require("dotenv");
const cache_1 = require("../../../../middlewares/cache");
const liveCurrencies_service_1 = require("../../conversions/liveCurrencies.service");
(0, dotenv_1.config)({ path: `.env` });
const memCache = new cache_1.Cache();
let downtimeCounter = { convert: 0 };
function saveCryptoQuotes(cryptocurrenciesData) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios.post("http://localhost:8000/api/v1/update-crypto-quotes", { data: cryptocurrenciesData }, // Pass the data in the request body
            {
                headers: {
                    "Content-Type": "application/json", // Specify JSON content type
                },
            });
            // Log response from the server
            console.log("Crypto quotes updated successfully:", response.data);
        }
        catch (error) {
            // Handle errors and log useful details
            if (error.response) {
                console.error("Error response from server:", error.response.data);
                console.error("Status code:", error.response.status);
            }
            else if (error.request) {
                console.error("No response received from server:", error.request);
            }
            else {
                console.error("Error during request setup:", error.message);
            }
        }
    });
}
function cryptoLiveUpdates() {
    return __awaiter(this, arguments, void 0, function* (start = 1, limit = 2) {
        var _a, _b, _c, _d, _e, _f;
        try {
            const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=${start}&limit=${limit}&convert=${"USD"}&CMC_PRO_API_KEY=${process.env.CMC_PRO_API_KEY}`;
            console.log("URL ", url);
            if (yield memCache.get(url)) {
                console.log("Fetching cryptoliveUpdates from cache");
                const result = { status: true, data: yield memCache.get(url) };
                (_a = process.send) === null || _a === void 0 ? void 0 : _a.call(process, result);
                return result;
            }
            else {
                const response = yield axios.get(url);
                if (response.status == 200) {
                    let responseData = response.data;
                    if (((_b = responseData === null || responseData === void 0 ? void 0 : responseData.status) === null || _b === void 0 ? void 0 : _b.error_code) == 0) {
                        const result = { status: true, data: responseData.data };
                        yield saveCryptoQuotes(responseData.data);
                        yield memCache.set(url, responseData.data, 3600);
                        (_c = process.send) === null || _c === void 0 ? void 0 : _c.call(process, result);
                        return result;
                    }
                    else {
                        (_d = process.send) === null || _d === void 0 ? void 0 : _d.call(process, { status: false, data: null });
                        return { status: false, data: null };
                    }
                }
                (_e = process.send) === null || _e === void 0 ? void 0 : _e.call(process, { status: false, data: null });
                return { status: false, data: null };
            }
        }
        catch (error) {
            downtimeCounter.convert += 1;
            if (downtimeCounter.convert >= 3) {
                (0, liveCurrencies_service_1.sendDevMail)("cryptoliveUpdates service seems to be having some challenges at the moment.");
                downtimeCounter.convert = 0;
            }
            (_f = process.send) === null || _f === void 0 ? void 0 : _f.call(process, { status: false, error: error.message });
            return { status: false, error: error.message };
        }
    });
}
exports.cryptoLiveUpdates = cryptoLiveUpdates;
// Entry point for the script
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error("Invalid arguments");
        process.exit(1);
    }
    const start = Number(args[0]);
    const limit = Number(args[1]);
    cryptoLiveUpdates(start, limit);
}
