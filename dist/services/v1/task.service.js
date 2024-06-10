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
const node_cron_1 = __importDefault(require("node-cron"));
const liveCurrencies_service_1 = require("./liveCurrencies.service");
const fetchRatesTask = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Task running");
    yield (0, liveCurrencies_service_1.fetchRates)("https://ng.investing.com/currencies/streaming-forex-rates-majors", true);
    // await fetchRates("https://finance.yahoo.com/currencies", true)
});
// Schedule the feed generator to run every minute
node_cron_1.default.schedule('* * * * *', fetchRatesTask);
