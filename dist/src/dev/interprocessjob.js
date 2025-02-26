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
exports.addJob = void 0;
const bullmq_1 = require("bullmq");
const connection_1 = require("./connection");
// const connection = redisClient.generic;
// Create a queue instance
const eventQueue = new bullmq_1.Queue("events", { connection: connection_1.connection });
/**
 * Adds a job to the events queue.
 * @param {Object} data - The data to process in the job.
 */
function addJob(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const job = yield eventQueue.add("event-job", data, {
                attempts: 3, // Retry 3 times
                backoff: { type: "fixed", delay: 5000 }, // Retry delay of 5 seconds
            });
            console.log(`Job added with ID: ${job.id}`);
        }
        catch (error) {
            console.error("Failed to add job:", error.message);
        }
    });
}
exports.addJob = addJob;
