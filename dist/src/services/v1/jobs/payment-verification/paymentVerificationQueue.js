"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentVerificationQueue = void 0;
const bullmq_1 = require("bullmq");
const connection_1 = __importDefault(require("../../../../redis/connection"));
const redisConnection = connection_1.default.generic;
// Create a BullMQ queue
exports.paymentVerificationQueue = new bullmq_1.Queue("payment-verification-queue", {
    connection: redisConnection,
});
