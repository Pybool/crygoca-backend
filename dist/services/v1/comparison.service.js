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
exports.compareExchangeProviders = exports.convertCurrency = exports.getUserCountry = void 0;
const axios = require("axios");
const countries_1 = require("../../helpers/countries");
const currenciesCountryCodes_1 = require("../../helpers/currenciesCountryCodes");
// https://api.transferwise.com/v3/comparisons/?sendAmount=1000&sourceCurrency=CAD&targetCurrency=USD
require("./liveCurrencies.service");
const geoip_lite_1 = __importDefault(require("geoip-lite")); // Import geoip-lite library
const dotenv_1 = require("dotenv");
const ejs_1 = __importDefault(require("ejs"));
const juice_1 = __importDefault(require("juice"));
const mailtrigger_1 = __importDefault(require("./mailtrigger"));
const cache_1 = require("../../middlewares/cache");
(0, dotenv_1.config)({ path: `.env` });
const memCache = new cache_1.Cache();
let downtimeCounter = { convert: 0 };
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
                    forwardedIp: req.headers["x-forwarded-for"],
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
function convertCurrency(from, to, currencyFrom, currencyTo, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = {
                lang: "en",
                from: from === null || from === void 0 ? void 0 : from.toUpperCase(),
                to: to === null || to === void 0 ? void 0 : to.toUpperCase(),
                currencyFrom: currencyFrom === null || currencyFrom === void 0 ? void 0 : currencyFrom.toUpperCase(),
                currencyTo: currencyTo === null || currencyTo === void 0 ? void 0 : currencyTo.toUpperCase(),
                amount: parseInt(amount) || 1,
                maxAge: 0,
            };
            return {
                "status": true,
                "data": {
                    "status": true,
                    "data": {
                        "meta": {
                            "last_updated_at": "2024-09-23T23:59:59Z"
                        },
                        "data": {
                            "NGN": {
                                "code": "NGN",
                                "value": 1592.9863997024
                            }
                        }
                    }
                }
            };
            // https://api.currencyapi.com/v3/latest?apikey=cur_live_d52M3q2XMNDurG4Q7kHtSr3P5iqTsNWpUtF5kcNx&currencies=NGN&base_currency=GBP
            const url = `https://api.currencyapi.com/v3/latest?apikey=${process.env.CURRENCYAPI_APP_ID || 'cur_live_d52M3q2XMNDurG4Q7kHtSr3P5iqTsNWpUtF5kcNx'}&base_currency=${data.currencyFrom}&currencies=${data.currencyTo}&amount=${data.amount}`;
            console.log("Cache ", memCache.get(url));
            if (memCache.get(url)) {
                console.log("Fetching conversion from cache");
                return memCache.get(url);
            }
            else {
                const response = yield axios.get(url);
                console.log("STATUS ", response.status);
                if (response.status) {
                    let responseData = response.data;
                    memCache.set(url, { status: true, data: responseData }, 1200);
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
    });
}
exports.convertCurrency = convertCurrency;
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
        return {
            "status": true,
            "filter": [],
            "data": {
                "sourceCurrency": "USD",
                "targetCurrency": "CAD",
                "sourceCountry": null,
                "targetCountry": null,
                "providerCountry": null,
                "providerTypes": [
                    "bank",
                    "moneyTransferProvider"
                ],
                "sendAmount": 500,
                "providerType": null,
                "providers": [
                    {
                        "id": 21,
                        "alias": "bank-of-america",
                        "name": "Bank of America",
                        "logos": {
                            "normal": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/bank-of-america.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/bank-of-america.png"
                            },
                            "inverse": {
                                "svgUrl": null,
                                "pngUrl": null
                            },
                            "white": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/bank-of-america--white.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/bank-of-america--white.png"
                            },
                            "altText": "Bank of America"
                        },
                        "type": "bank",
                        "partner": false,
                        "quotes": [
                            {
                                "rate": 1.30774822,
                                "fee": 0,
                                "dateCollected": "2024-09-24T17:07:26Z",
                                "sourceCountry": "US",
                                "targetCountry": "CA",
                                "markup": 2.67920223,
                                "receivedAmount": 653.87,
                                "deliveryEstimation": {
                                    "providerGivesEstimate": true,
                                    "duration": {
                                        "min": "PT24H",
                                        "max": "PT48H"
                                    },
                                    "durationType": "CALENDAR",
                                    "deliveryDate": {
                                        "min": "2024-09-25T19:26:40.693930046Z",
                                        "max": "2024-09-26T19:26:40.693930046Z"
                                    }
                                }
                            }
                        ],
                        "logo": "https://dq8dwmysp7hk1.cloudfront.net/logos/bank-of-america.svg"
                    },
                    {
                        "id": 39,
                        "alias": "wise",
                        "name": "Wise",
                        "logos": {
                            "normal": {
                                "svgUrl": "https://wise.com/public-resources/assets/logos/wise-personal/logo.svg",
                                "pngUrl": "https://wise.com/public-resources/assets/logos/wise-personal/logo.png"
                            },
                            "inverse": {
                                "svgUrl": "https://wise.com/public-resources/assets/logos/wise-personal/logo_inverse.svg",
                                "pngUrl": "https://wise.com/public-resources/assets/logos/wise-personal/logo_inverse.png"
                            },
                            "white": {
                                "svgUrl": "https://wise.com/public-resources/assets/logos/wise-personal/logo_white.svg",
                                "pngUrl": "https://wise.com/public-resources/assets/logos/wise-personal/logo_white.png"
                            },
                            "altText": "Wise"
                        },
                        "type": "moneyTransferProvider",
                        "partner": false,
                        "quotes": [
                            {
                                "rate": 1.34375,
                                "fee": 3.91,
                                "dateCollected": "2024-09-24T19:26:40Z",
                                "sourceCountry": null,
                                "targetCountry": null,
                                "markup": 0,
                                "receivedAmount": 666.62,
                                "deliveryEstimation": {
                                    "providerGivesEstimate": true,
                                    "duration": {
                                        "min": "PT31H33M19.268999855S",
                                        "max": "PT31H33M19.268999855S"
                                    },
                                    "durationType": "CALENDAR",
                                    "deliveryDate": {
                                        "min": "2024-09-26T03:00:00.000000385Z",
                                        "max": "2024-09-26T03:00:00.000000385Z"
                                    }
                                }
                            }
                        ],
                        "logo": "https://wise.com/public-resources/assets/logos/wise-personal/logo.svg"
                    },
                    {
                        "id": 22,
                        "alias": "western-union",
                        "name": "Western Union",
                        "logos": {
                            "normal": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/western-union.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/western-union.png"
                            },
                            "inverse": {
                                "svgUrl": null,
                                "pngUrl": null
                            },
                            "white": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/western-union--white.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/western-union--white.png"
                            },
                            "altText": "Western Union"
                        },
                        "type": "moneyTransferProvider",
                        "partner": false,
                        "quotes": [
                            {
                                "rate": 1.32531524,
                                "fee": 1.99,
                                "dateCollected": "2024-09-24T04:10:17Z",
                                "sourceCountry": "US",
                                "targetCountry": "CA",
                                "markup": 1.37188912,
                                "receivedAmount": 660.02,
                                "deliveryEstimation": {
                                    "providerGivesEstimate": true,
                                    "duration": null,
                                    "durationType": null,
                                    "deliveryDate": null
                                }
                            }
                        ],
                        "logo": "https://dq8dwmysp7hk1.cloudfront.net/logos/western-union.svg"
                    },
                    {
                        "id": 41,
                        "alias": "xoom",
                        "name": "Xoom",
                        "logos": {
                            "normal": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/xoom.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/xoom.png"
                            },
                            "inverse": {
                                "svgUrl": null,
                                "pngUrl": null
                            },
                            "white": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/xoom--white.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/xoom--white.png"
                            },
                            "altText": "Xoom (A PayPal Service)"
                        },
                        "type": "moneyTransferProvider",
                        "partner": false,
                        "quotes": [
                            {
                                "rate": 1.2910822,
                                "fee": 4.99,
                                "dateCollected": "2024-09-24T10:05:03Z",
                                "sourceCountry": "US",
                                "targetCountry": "CA",
                                "markup": 3.91946419,
                                "receivedAmount": 639.1,
                                "deliveryEstimation": {
                                    "providerGivesEstimate": true,
                                    "duration": {
                                        "min": "PT24H",
                                        "max": "PT24H"
                                    },
                                    "durationType": "CALENDAR",
                                    "deliveryDate": {
                                        "min": "2024-09-25T19:26:40.693866736Z",
                                        "max": "2024-09-25T19:26:40.693866736Z"
                                    }
                                }
                            }
                        ],
                        "logo": "https://dq8dwmysp7hk1.cloudfront.net/logos/xoom.svg"
                    },
                    {
                        "id": 6,
                        "alias": "paypal",
                        "name": "PayPal",
                        "logos": {
                            "normal": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/paypal.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/paypal.png"
                            },
                            "inverse": {
                                "svgUrl": null,
                                "pngUrl": null
                            },
                            "white": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/paypal--white.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/paypal--white.png"
                            },
                            "altText": "PayPal"
                        },
                        "type": "moneyTransferProvider",
                        "partner": false,
                        "quotes": [
                            {
                                "rate": 1.29379002,
                                "fee": 4.99,
                                "dateCollected": "2024-09-24T18:33:08.028988Z",
                                "sourceCountry": "US",
                                "targetCountry": "CA",
                                "markup": 3.717952,
                                "receivedAmount": 640.44,
                                "deliveryEstimation": {
                                    "providerGivesEstimate": true,
                                    "duration": {
                                        "min": "PT72H",
                                        "max": "PT192H"
                                    },
                                    "durationType": "CALENDAR",
                                    "deliveryDate": {
                                        "min": "2024-09-27T19:26:40.693948765Z",
                                        "max": "2024-10-02T19:26:40.693948765Z"
                                    }
                                }
                            }
                        ],
                        "logo": "https://dq8dwmysp7hk1.cloudfront.net/logos/paypal.svg"
                    },
                    {
                        "id": 70,
                        "alias": "sfcu",
                        "name": "Stanford Federal Credit Union",
                        "logos": {
                            "normal": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/stanford-fcu.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/stanford-fcu.png"
                            },
                            "inverse": {
                                "svgUrl": null,
                                "pngUrl": null
                            },
                            "white": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/stanford-fcu--white.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/stanford-fcu--white.png"
                            },
                            "altText": "Stanford Federal Credit Union"
                        },
                        "type": "bank",
                        "partner": true,
                        "quotes": [
                            {
                                "rate": 1.34375,
                                "fee": 2.66,
                                "dateCollected": "2024-09-24T19:26:40Z",
                                "sourceCountry": null,
                                "targetCountry": null,
                                "markup": 0,
                                "receivedAmount": 668.3,
                                "deliveryEstimation": {
                                    "providerGivesEstimate": true,
                                    "duration": {
                                        "min": "PT31H33M19.224658594S",
                                        "max": "PT31H33M19.224658594S"
                                    },
                                    "durationType": "CALENDAR",
                                    "deliveryDate": {
                                        "min": "2024-09-26T03:00:00.000000397Z",
                                        "max": "2024-09-26T03:00:00.000000397Z"
                                    }
                                }
                            }
                        ],
                        "logo": "https://dq8dwmysp7hk1.cloudfront.net/logos/stanford-fcu.svg"
                    },
                    {
                        "id": 113,
                        "alias": "andrewsfcu",
                        "name": "Andrews Federal Credit Union",
                        "logos": {
                            "normal": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/andrews-federal-credit-union.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/andrews-federal-credit-union.png"
                            },
                            "inverse": {
                                "svgUrl": null,
                                "pngUrl": null
                            },
                            "white": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/andrews-federal-credit-union--white.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/andrews-federal-credit-union--white.png"
                            },
                            "altText": "Andrews Federal Credit Union"
                        },
                        "type": "bank",
                        "partner": true,
                        "quotes": [
                            {
                                "rate": 1.34375,
                                "fee": 3.16,
                                "dateCollected": "2024-09-24T19:26:40Z",
                                "sourceCountry": null,
                                "targetCountry": null,
                                "markup": 0,
                                "receivedAmount": 667.63,
                                "deliveryEstimation": {
                                    "providerGivesEstimate": true,
                                    "duration": {
                                        "min": "PT31H33M19.268968551S",
                                        "max": "PT31H33M19.268968551S"
                                    },
                                    "durationType": "CALENDAR",
                                    "deliveryDate": {
                                        "min": "2024-09-26T03:00:00.000000222Z",
                                        "max": "2024-09-26T03:00:00.000000222Z"
                                    }
                                }
                            }
                        ],
                        "logo": "https://dq8dwmysp7hk1.cloudfront.net/logos/andrews-federal-credit-union.svg"
                    },
                    {
                        "id": 59,
                        "alias": "ofx",
                        "name": "OFX",
                        "logos": {
                            "normal": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/ofx.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/ofx.png"
                            },
                            "inverse": {
                                "svgUrl": null,
                                "pngUrl": null
                            },
                            "white": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/ofx--white.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/ofx--white.png"
                            },
                            "altText": "OFX"
                        },
                        "type": "moneyTransferProvider",
                        "partner": false,
                        "quotes": [
                            {
                                "rate": 1.32540956,
                                "fee": 0,
                                "dateCollected": "2024-09-24T18:47:10.744634Z",
                                "sourceCountry": null,
                                "targetCountry": null,
                                "markup": 1.36486995,
                                "receivedAmount": 662.7,
                                "deliveryEstimation": {
                                    "providerGivesEstimate": true,
                                    "duration": null,
                                    "durationType": null,
                                    "deliveryDate": null
                                }
                            }
                        ],
                        "logo": "https://dq8dwmysp7hk1.cloudfront.net/logos/ofx.svg"
                    },
                    {
                        "id": 107,
                        "alias": "instarem",
                        "name": "Instarem",
                        "logos": {
                            "normal": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/instarem.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/instarem.png"
                            },
                            "inverse": {
                                "svgUrl": null,
                                "pngUrl": null
                            },
                            "white": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/instarem--white.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/instarem--white.png"
                            },
                            "altText": "Instarem."
                        },
                        "type": "moneyTransferProvider",
                        "partner": false,
                        "quotes": [
                            {
                                "rate": 1.330311,
                                "fee": 0,
                                "dateCollected": "2024-09-24T17:36:47.723184Z",
                                "sourceCountry": "US",
                                "targetCountry": "CA",
                                "markup": 1.00011163,
                                "receivedAmount": 665.16,
                                "deliveryEstimation": {
                                    "providerGivesEstimate": true,
                                    "duration": null,
                                    "durationType": null,
                                    "deliveryDate": null
                                }
                            }
                        ],
                        "logo": "https://dq8dwmysp7hk1.cloudfront.net/logos/instarem.svg"
                    },
                    {
                        "id": 66,
                        "alias": "wells-fargo",
                        "name": "Wells Fargo",
                        "logos": {
                            "normal": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/wells-fargo.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/wells-fargo.png"
                            },
                            "inverse": {
                                "svgUrl": null,
                                "pngUrl": null
                            },
                            "white": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/wells-fargo--white.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/wells-fargo--white.png"
                            },
                            "altText": "Wells Fargo"
                        },
                        "type": "bank",
                        "partner": false,
                        "quotes": [
                            {
                                "rate": 1.30130638,
                                "fee": 0,
                                "dateCollected": "2024-09-23T21:20:40Z",
                                "sourceCountry": "US",
                                "targetCountry": "CA",
                                "markup": 3.15859498,
                                "receivedAmount": 650.65,
                                "deliveryEstimation": {
                                    "providerGivesEstimate": true,
                                    "duration": null,
                                    "durationType": null,
                                    "deliveryDate": null
                                }
                            }
                        ],
                        "logo": "https://dq8dwmysp7hk1.cloudfront.net/logos/wells-fargo.svg"
                    },
                    {
                        "id": 24,
                        "alias": "chase",
                        "name": "Chase (US)",
                        "logos": {
                            "normal": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/chase.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/chase.png"
                            },
                            "inverse": {
                                "svgUrl": null,
                                "pngUrl": null
                            },
                            "white": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/chase--white.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/chase--white.png"
                            },
                            "altText": "Chase"
                        },
                        "type": "bank",
                        "partner": false,
                        "quotes": [
                            {
                                "rate": 1.30341312,
                                "fee": 5,
                                "dateCollected": "2024-09-24T11:56:43Z",
                                "sourceCountry": "US",
                                "targetCountry": "CA",
                                "markup": 3.00181433,
                                "receivedAmount": 645.19,
                                "deliveryEstimation": {
                                    "providerGivesEstimate": true,
                                    "duration": {
                                        "min": "PT24H",
                                        "max": "PT192H"
                                    },
                                    "durationType": "CALENDAR",
                                    "deliveryDate": {
                                        "min": "2024-09-25T19:26:40.693900165Z",
                                        "max": "2024-10-02T19:26:40.693900165Z"
                                    }
                                }
                            }
                        ],
                        "logo": "https://dq8dwmysp7hk1.cloudfront.net/logos/chase.svg"
                    },
                    {
                        "id": 121,
                        "alias": "xe",
                        "name": "Xe",
                        "logos": {
                            "normal": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/xe.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/xe.png"
                            },
                            "inverse": {
                                "svgUrl": null,
                                "pngUrl": null
                            },
                            "white": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/xe--white.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/xe--white.png"
                            },
                            "altText": "Xe"
                        },
                        "type": "moneyTransferProvider",
                        "partner": false,
                        "quotes": [
                            {
                                "rate": 1.31859813,
                                "fee": 0,
                                "dateCollected": "2024-09-24T19:17:19.236079Z",
                                "sourceCountry": "US",
                                "targetCountry": null,
                                "markup": 1.87176707,
                                "receivedAmount": 659.3,
                                "deliveryEstimation": {
                                    "providerGivesEstimate": true,
                                    "duration": {
                                        "min": null,
                                        "max": "PT24H"
                                    },
                                    "durationType": "CALENDAR",
                                    "deliveryDate": {
                                        "min": null,
                                        "max": "2024-09-25T19:26:40.693723050Z"
                                    }
                                }
                            }
                        ],
                        "logo": "https://dq8dwmysp7hk1.cloudfront.net/logos/xe.svg"
                    },
                    {
                        "id": 104,
                        "alias": "remitly",
                        "name": "Remitly",
                        "logos": {
                            "normal": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/remitly.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/remitly.png"
                            },
                            "inverse": {
                                "svgUrl": null,
                                "pngUrl": null
                            },
                            "white": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/remitly--white.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/remitly--white.png"
                            },
                            "altText": "Remitly"
                        },
                        "type": "moneyTransferProvider",
                        "partner": false,
                        "quotes": [
                            {
                                "rate": 1.33410502,
                                "fee": 1.99,
                                "dateCollected": "2024-09-24T18:43:32.303225Z",
                                "sourceCountry": "US",
                                "targetCountry": "CA",
                                "markup": 0.71776595,
                                "receivedAmount": 664.4,
                                "deliveryEstimation": {
                                    "providerGivesEstimate": true,
                                    "duration": null,
                                    "durationType": null,
                                    "deliveryDate": null
                                }
                            }
                        ],
                        "logo": "https://dq8dwmysp7hk1.cloudfront.net/logos/remitly.svg"
                    },
                    {
                        "id": 30,
                        "alias": "world-remit",
                        "name": "WorldRemit",
                        "logos": {
                            "normal": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/world-remit.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/world-remit.png"
                            },
                            "inverse": {
                                "svgUrl": null,
                                "pngUrl": null
                            },
                            "white": {
                                "svgUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/world-remit--white.svg",
                                "pngUrl": "https://dq8dwmysp7hk1.cloudfront.net/logos/world-remit--white.png"
                            },
                            "altText": "WorldRemit"
                        },
                        "type": "moneyTransferProvider",
                        "partner": false,
                        "quotes": [
                            {
                                "rate": 1.31734541,
                                "fee": 2.99,
                                "dateCollected": "2024-09-24T10:16:31Z",
                                "sourceCountry": "US",
                                "targetCountry": "CA",
                                "markup": 1.96499274,
                                "receivedAmount": 654.73,
                                "deliveryEstimation": {
                                    "providerGivesEstimate": true,
                                    "duration": {
                                        "min": null,
                                        "max": "PT48H"
                                    },
                                    "durationType": "CALENDAR",
                                    "deliveryDate": {
                                        "min": null,
                                        "max": "2024-09-26T19:26:40.693884793Z"
                                    }
                                }
                            }
                        ],
                        "logo": "https://dq8dwmysp7hk1.cloudfront.net/logos/world-remit.svg"
                    }
                ]
            }
        };
        try {
            const response = yield axios.get(`https://api.transferwise.com/v3/comparisons/?sendAmount=${data.amount}&sourceCurrency=${data.currencyFrom}&targetCurrency=${data.currencyTo}`);
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
    });
}
exports.compareExchangeProviders = compareExchangeProviders;
const sendDevMail = (msg = null) => {
    console.log("I was called.....");
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        const responseTemplate = yield ejs_1.default.renderFile("dist/templates/serviceDown.ejs", {
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
    }));
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
