"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertCryptoToCrypto = void 0;
const axios_1 = __importDefault(require("axios"));
async function convertCryptoToCrypto(from, to, amount) {
    const apiKey = process.env.COINLAYER_API_KEY;
    const url = `https://api.coinlayer.com/convert?access_key=${apiKey}&from=${from}&to=${to}&amount=${amount}`;
    const response = await axios_1.default.get(url);
    const data = response.data;
    if (!data.success) {
        console.log("Conversion failed. Check API key, parameters, or quota.");
        return null;
    }
    const original = Number(data.query.amount);
    const rate = Number(data.info.rate);
    const result = Number(data.result);
    const precision = 18; // Enough to prevent exponentials
    const originalFixed = original.toFixed(precision).replace(/\.?0+$/, "");
    const resultFixed = result.toFixed(6); // 6 decimal places for final value
    const rateFixed = rate.toFixed(6);
    return {
        from,
        to,
        originalAmount: originalFixed,
        rate: rateFixed,
        convertedAmount: resultFixed,
        readable: `${originalFixed} ${from} ≈ ${resultFixed} ${to}`,
        timestamp: new Date(data.info.timestamp * 1000).toISOString(),
    };
}
exports.convertCryptoToCrypto = convertCryptoToCrypto;
