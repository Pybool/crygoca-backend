"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationQueue = exports.transferQueue = void 0;
const bullmq_1 = require("bullmq");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.transferQueue = new bullmq_1.Queue("transfer-queue", {
    connection: {
        host: "127.0.0.1",
        port: 6379,
    },
});
exports.notificationQueue = new bullmq_1.Queue("notification-queue", {
    connection: { host: "127.0.0.1", port: 6379 },
});
