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
const bullmq_1 = require("bullmq");
const connection_1 = __importDefault(require("../../../../redis/connection"));
const redisConnection = connection_1.default.generic;
// import { processQueue } from "./path-to-your-script"; // Import your processQueue logic
// Create a BullMQ worker
const worker = new bullmq_1.Worker("payment-verification-queue", // Queue name
(job) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Processing job: ${job.name}`);
    // Call your queue processing logic
    // await processQueue();
}), { connection: redisConnection });
// Handle worker events
worker.on("completed", (job) => {
    console.log(`Job completed: ${job.id}`);
});
worker.on("failed", (job, err) => {
    console.error(`Job failed: ${job.id}`, err);
});
console.log("done");
