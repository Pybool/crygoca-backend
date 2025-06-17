"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareExchangeProviders = exports.convertCurrency = exports.getUserCountry = void 0;
const axios = require("axios");
const countries_1 = require("../../../helpers/countries");
const currenciesCountryCodes_1 = require("../../../helpers/currenciesCountryCodes");
// https://api.transferwise.com/v3/comparisons/?sendAmount=1000&sourceCurrency=CAD&targetCurrency=USD
require("./liveCurrencies.service");
const geoip_lite_1 = __importDefault(require("geoip-lite")); // Import geoip-lite library
const dotenv_1 = require("dotenv");
const ejs_1 = __importDefault(require("ejs"));
const juice_1 = __importDefault(require("juice"));
const mailtrigger_1 = __importDefault(require("../mail/mailtrigger"));
const cache_1 = require("../../../middlewares/cache");
(0, dotenv_1.config)({ path: `.env` });
const memCache = new cache_1.Cache();
let downtimeCounter = { convert: 0 };
async function getUserCountry(req) {
    try {
        let geoData = geoip_lite_1.default.lookup(req.ip);
        const countryCode = geoData?.country;
        geoData.country = (0, countries_1.getCountryNameByCode)(countryCode);
        geoData.currency = (0, currenciesCountryCodes_1.getCountryCurrencyByCountryCode)(countryCode);
        geoData.countryCode = countryCode;
        if (geoData) {
            return {
                geoData,
                connectionRemoteAddress: req.connection.remoteAddress,
                reqIp: req.ip,
                socketRemoteAddress: req.socket.remoteAddress,
                forwardedIp: req.headers["x-forwarded-for"],
            };
        }
        return null;
    }
    catch (error) {
        // console.error("Error fetching geolocation data:", error);
        return null; // Return null in case of errors
    }
}
exports.getUserCountry = getUserCountry;
async function convertCurrency(from, to, currencyFrom, currencyTo, amount) {
    try {
        const data = {
            lang: "en",
            from: from?.toUpperCase(),
            to: to?.toUpperCase(),
            currencyFrom: currencyFrom?.toUpperCase(),
            currencyTo: currencyTo?.toUpperCase(),
            amount: parseInt(amount) || 1,
            maxAge: 0,
        };
        const url = `https://api.currencyapi.com/v3/latest?apikey=${process.env.CURRENCYAPI_APP_ID}&base_currency=${data.currencyFrom}&currencies=${data.currencyTo}&amount=${data.amount}`;
        console.log("process.env.MOCK_EXCHANGE_RATE==='true'", process.env.MOCK_EXCHANGE_RATE);
        if (process.env.MOCK_EXCHANGE_RATE === 'true') {
            let value = 0.00;
            if (data.currencyFrom == 'USD' && data.currencyTo == 'GHS') {
                value = 15.30;
            }
            if (data.currencyFrom == 'GHS' && data.currencyTo == 'USD') {
                value = 0.065;
            }
            if (data.currencyFrom == 'USD' && data.currencyTo == 'ZAR') {
                value = 18.50;
            }
            if (data.currencyFrom == 'ZAR' && data.currencyTo == 'USD') {
                value = 0.054;
            }
            if (data.currencyFrom == 'GHS' && data.currencyTo == 'ZAR') {
                value = 1.20;
            }
            if (data.currencyFrom == 'ZAR' && data.currencyTo == 'GHS') {
                value = 0.83;
            }
            return { status: true, data: {
                    "meta": {
                        "last_updated_at": "2025-01-29T12:59:59Z"
                    },
                    "data": {
                        [data.currencyTo]: {
                            "code": data.currencyTo,
                            "value": value
                        }
                    }
                } };
        }
        console.log("URL ", url);
        const cacheData = await memCache.get(url);
        if (cacheData) {
            console.log("Fetching conversion from cache", cacheData);
            return cacheData;
        }
        else {
            const response = await axios.get(url);
            if (response.status) {
                let responseData = response.data;
                memCache.set(url, { status: true, data: responseData }, 14400);
                console.log("Exchange rate ", { status: true, data: responseData });
                return { status: true, data: responseData };
            }
            return { status: false, data: null };
        }
    }
    catch (error) {
        downtimeCounter.convert += 1;
        if (downtimeCounter.convert >= 3) {
            sendDevMail("Currency conversion service seems to be having some challenges at the moment.");
            downtimeCounter.convert = 0;
        }
        return { status: false, error: error.message };
    }
}
exports.convertCurrency = convertCurrency;
async function compareExchangeProviders(from, to, currencyFrom, currencyTo, amount, compare) {
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
        const response = await axios.get(`https://api.transferwise.com/v3/comparisons/?sendAmount=${data.amount}&sourceCurrency=${data.currencyFrom}&targetCurrency=${data.currencyTo}`);
        const filter = [];
        if (response.status) {
            let responseData = response.data;
            responseData = response.data;
            return { status: true, filter, data: responseData };
        }
        sendDevMail("Currency comparison service seems to to having challenges at the moment..");
        return { status: false, filter, data: null };
    }
    catch (error) {
        sendDevMail("Currency comparison service seems to to having challenges at the moment..");
        return { status: false, error: error.message };
    }
}
exports.compareExchangeProviders = compareExchangeProviders;
const sendDevMail = (msg = null) => {
    return new Promise(async (resolve, reject) => {
        const responseTemplate = await ejs_1.default.renderFile("dist/templates/serviceDown.ejs", {
            msg,
        });
        const mailOptions = {
            from: `downtime@crygoca.co.uk`,
            to: ["ekoemmanueljavl@gmail.com", "downtime@crygoca.co.uk"],
            subject: "Crygoca Service Down",
            text: msg || "Currency conversion service is down",
            html: (0, juice_1.default)(responseTemplate),
        };
        (0, mailtrigger_1.default)(mailOptions)
            .then((response) => {
            resolve(console.log("Email sent successfully:", response));
        })
            .catch((error) => {
            reject(console.error("Failed to send email:", error));
        });
    });
};
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
