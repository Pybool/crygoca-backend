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
exports.scheduleVerificationJob = void 0;
const paymentVerificationQueue_1 = require("./paymentVerificationQueue");
// Function to schedule a job
function scheduleVerificationJob(jobData) {
    return __awaiter(this, void 0, void 0, function* () {
        yield paymentVerificationQueue_1.paymentVerificationQueue.add("process-verifications", // Job name
        jobData, // Job data (if needed)
        {
            repeat: {
                every: 60 * 60 * 1000, // Repeat every 1 hour (in milliseconds)
            },
        });
        console.log("Job added to queue:", jobData);
    });
}
exports.scheduleVerificationJob = scheduleVerificationJob;
// // Schedule the job
// scheduleVerificationJob().catch((err) =>
//   console.error("Error scheduling job:", err)
// );
