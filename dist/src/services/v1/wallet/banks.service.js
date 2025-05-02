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
exports.getIntlBanksForCountry = exports.saveBanksForCountry = void 0;
const banks_model_1 = __importDefault(require("../../../models/banks.model"));
// Create FormData instance
const FormData = require("form-data");
const saveBanksForCountry = (banks, countryCode) => __awaiter(void 0, void 0, void 0, function* () {
    for (let bank of banks) {
        yield banks_model_1.default.create({
            countryCode: countryCode,
            name: bank.value,
        });
    }
    return "Completed Successfully";
});
exports.saveBanksForCountry = saveBanksForCountry;
const getIntlBanksForCountry = (countryCode) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const banks = yield banks_model_1.default.find({ countryCode: countryCode });
        return {
            status: true,
            data: banks,
        };
    }
    catch (error) {
        throw error;
    }
});
exports.getIntlBanksForCountry = getIntlBanksForCountry;
