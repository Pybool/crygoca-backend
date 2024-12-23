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
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const startValues = [1, 5001, 10001]; // Start values
const limit = 5000;
let isCronRunning = false; // Lock mechanism to prevent overlapping
const fetchCryptoLiveUpdates = () => __awaiter(void 0, void 0, void 0, function* () {
    if (isCronRunning) {
        console.log("Skipping execution: Previous task is still running.");
        return;
    }
    console.log("Crypto task initiated...");
    isCronRunning = true;
    // Helper function to process tasks sequentially
    const processTask = (index) => {
        if (index >= startValues.length) {
            console.log("All tasks completed for this cycle.");
            isCronRunning = false;
            return;
        }
        const scriptPath = path_1.default.resolve(__dirname, "./scripts/cryptoLiveUpdates.ts");
        const child = (0, child_process_1.fork)(scriptPath, [startValues[index], limit]);
        console.log(`Processing start value: ${startValues[index]}`);
        child.on("message", (message) => {
            console.log(`Message from child process (start: ${startValues[index]}):}`);
            if (message.status === true) {
                console.log(`Task for start value ${startValues[index]} succeeded. Moving to next task.`);
                child.kill(); // Ensure child process is terminated
                processTask(index + 1); // Process the next start value
            }
            else {
                console.error(`Task for start value ${startValues[index]} failed. Stopping.`);
                child.kill(); // Terminate the child process on failure
                isCronRunning = false;
            }
        });
        child.on("exit", (code) => {
            if (code !== 0) {
                console.error(`Child process for start value ${startValues[index]} exited with error code: ${code}`);
            }
            child.kill(); // Ensure the child process is cleaned up
        });
        child.on("error", (err) => {
            console.error(`Error in child process for start value ${startValues[index]}:`, err);
            child.kill();
            isCronRunning = false;
        });
    };
    // Start processing tasks from the first value
    processTask(0);
});
// Schedule the task to run every hour
node_cron_1.default.schedule("0 * * * *", fetchCryptoLiveUpdates);
// cron.schedule('* * * * *', fetchCryptoLiveUpdates);
console.log("Cron job scheduled to run every hour.");
