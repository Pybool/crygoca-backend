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
exports.checkIfTransactionHasReward = void 0;
const settings_1 = require("../../../models/settings");
// Sample currency exchange rate function (in real scenarios, use an API like Fixer.io)
const getExchangeRateToUSD = (currency) => __awaiter(void 0, void 0, void 0, function* () {
    const exchangeRates = {
        USD: 1,
        EUR: 1.1, // Assume 1 EUR = 1.1 USD
        GBP: 1.25, // Assume 1 GBP = 1.25 USD
        NGN: (1 / 1590)
        // Add more currencies as needed
    };
    return exchangeRates[currency]; // Return 1 if currency is USD or unknown currency
});
const checkIfTransactionHasReward = (verifiedTransaction) => __awaiter(void 0, void 0, void 0, function* () {
    const rewardFactor = settings_1.ADMIN_SETTINGS.referrals.rewardfactor; // 2% reward
    const dollarThreshold = settings_1.ADMIN_SETTINGS.referrals.rewardThreshold; // Minimum amount for reward in USD
    const { amount_settled, currency } = verifiedTransaction.data;
    try {
        // Step 1: Get the exchange rate for the given currency
        const exchangeRate = yield getExchangeRateToUSD(currency);
        if (!exchangeRate) {
            throw new Error("Invalid currency for reward");
        }
        // Step 2: Convert the transaction amount to USD
        const amountInUSD = amount_settled * exchangeRate;
        console.log("Exchange rate ", amount_settled, exchangeRate);
        // Step 3: Check if the converted amount is greater than the dollar threshold
        if (amountInUSD >= dollarThreshold) {
            // Step 4: Calculate the reward (2% of the USD value)
            const rewardAmount = amountInUSD * rewardFactor;
            return {
                eligibleForReward: true,
                rewardAmount,
                amountInUSD, // Optional: You can return the converted amount for reference
            };
        }
        else {
            return {
                eligibleForReward: false,
                message: `Transaction does not qualify for a reward. Amount in USD is below ${dollarThreshold}.`,
            };
        }
    }
    catch (error) {
        console.error("Error checking reward eligibility:", error.message);
        return { eligibleForReward: false, message: "Error calculating reward." };
    }
});
exports.checkIfTransactionHasReward = checkIfTransactionHasReward;
