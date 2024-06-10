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
exports.compareExchangeProviders = exports.getUserCountry = void 0;
const axios = require("axios");
const countries_1 = require("../../helpers/countries");
const currenciesCountryCodes_1 = require("../../helpers/currenciesCountryCodes");
// https://api.transferwise.com/v3/comparisons/?sendAmount=1000&sourceCurrency=CAD&targetCurrency=USD
require("./liveCurrencies.service");
const geoip_lite_1 = __importDefault(require("geoip-lite")); // Import geoip-lite library
function getUserCountry(req) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let geoData = geoip_lite_1.default.lookup(req.ip);
            const countryCode = geoData.country;
            geoData.country = (0, countries_1.getCountryNameByCode)(countryCode);
            geoData.currency = (0, currenciesCountryCodes_1.getCountryCurrencyByCountryCode)(countryCode);
            geoData.countryCode = countryCode;
            if (geoData) {
                return {
                    geoData,
                    connectionRemoteAddress: req.connection.remoteAddress,
                    reqIp: req.ip,
                    socketRemoteAddress: req.socket.remoteAddress,
                    forwardedIp: req.headers["x-forwarded-for"]
                };
            }
            return null;
        }
        catch (error) {
            console.error("Error fetching geolocation data:", error);
            return null; // Return null in case of errors
        }
    });
}
exports.getUserCountry = getUserCountry;
function compareExchangeProviders(from, to, currencyFrom, currencyTo, amount, compare) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = {
            lang: "en",
            from: from.toUpperCase(),
            to: to.toUpperCase(),
            currencyFrom: currencyFrom.toUpperCase(),
            currencyTo: currencyTo.toUpperCase(),
            amount: parseInt(amount) || 1,
            maxAge: 0,
        };
        try {
            const response = yield axios.get(`https://api.transferwise.com/v3/comparisons/?sendAmount=${data.amount}&sourceCurrency=${data.currencyFrom}&targetCurrency=${data.currencyTo}`);
            const filter = [];
            let responseData = response.data;
            if (compare === "1") {
                responseData = response.data;
            }
            else {
                responseData = calculateAverageQuotes(responseData.providers);
            }
            return { status: true, filter, data: responseData };
        }
        catch (error) {
            return { status: false, error: error.message };
        }
    });
}
exports.compareExchangeProviders = compareExchangeProviders;
function calculateAverageQuotes(providers) {
    let totalRate = 0;
    let totalReceivedAmount = 0;
    let totalQuotes = 0;
    providers.forEach((provider) => {
        provider.quotes.forEach((quote) => {
            totalRate += quote.rate;
            totalReceivedAmount += quote.receivedAmount;
            totalQuotes++;
        });
    });
    const averageRate = totalRate / totalQuotes;
    const averageReceivedAmount = totalReceivedAmount / totalQuotes;
    // You can return averageRate or averageReceivedAmount, depending on your requirement
    return { averageRate, averageReceivedAmount };
}
