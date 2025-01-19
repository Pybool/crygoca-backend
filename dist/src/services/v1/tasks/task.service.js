"use strict";
// import cron from 'node-cron';
// import { fetchRates } from "./liveCurrencies.service";
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
// const fetchRatesTask = async () => {
//     console.log("Task running")
//     await fetchRates("https://ng.investing.com/currencies/streaming-forex-rates-majors", true)
//     // await fetchRates("https://finance.yahoo.com/currencies", true)
// };
// // Schedule the feed generator to run every minute
// cron.schedule('* * * * *', fetchRatesTask);
const node_cron_1 = __importDefault(require("node-cron"));
const child_process_1 = require("child_process"); // Import fork from child_process module
const path_1 = __importDefault(require("path")); // Path module to resolve the file location
// Define the task that fetches rates
const fetchRatesTask = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Task running");
    let extension = ".ts";
    if (process.env.NODE_ENV === "prod") {
        extension = '.js';
    }
    // The path to your liveCurrencies.service.js file (or where your fetchRates method is defined)
    const scriptPath = path_1.default.resolve(__dirname, `./scripts/livecurrencies${extension}`); // Adjust this path accordingly
    // console.log("scriptPath ", scriptPath)
    // Fork a child process to run the task independently
    const child = (0, child_process_1.fork)(scriptPath, ['https://ng.investing.com/currencies/streaming-forex-rates-majors', 'true']);
    child.on('message', (message) => {
        console.log('Message from child process:', message);
    });
    child.on('exit', (code) => {
        console.log(`Child process exited with code ${code}`);
    });
});
// Schedule the task to run every minute using cron
// cron.schedule('* * * * *', fetchRatesTask);
node_cron_1.default.schedule("0 * * * *", fetchRatesTask);
