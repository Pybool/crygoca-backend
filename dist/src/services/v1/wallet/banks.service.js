"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIntlBanksForCountry = exports.saveBanksForCountry = void 0;
const banks_model_1 = __importDefault(require("../../../models/banks.model"));
// Create FormData instance
const FormData = require("form-data");
const saveBanksForCountry = async (banks, countryCode) => {
    for (let bank of banks) {
        await banks_model_1.default.create({
            countryCode: countryCode,
            name: bank.value,
        });
    }
    return "Completed Successfully";
};
exports.saveBanksForCountry = saveBanksForCountry;
const getIntlBanksForCountry = async (countryCode) => {
    try {
        const banks = await banks_model_1.default.find({ countryCode: countryCode });
        return {
            status: true,
            data: banks,
        };
    }
    catch (error) {
        throw error;
    }
};
exports.getIntlBanksForCountry = getIntlBanksForCountry;
