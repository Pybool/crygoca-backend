"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationQueue = exports.transferQueue = void 0;
const bullmq_1 = require("bullmq");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const CRYGOCA_REDIS_HOST = process.env.CRYGOCA_REDIS_HOST;
exports.transferQueue = new bullmq_1.Queue("transfer-queue", {
    connection: {
        host: CRYGOCA_REDIS_HOST,
        port: 6379,
    },
});
exports.notificationQueue = new bullmq_1.Queue("notification-queue", {
    connection: { host: CRYGOCA_REDIS_HOST, port: 6379 },
});
