"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.escrowBalanceQueue = void 0;
// escrow-balance-queue.ts
const bullmq_1 = require("bullmq");
const redisConnection_1 = require("../redisConnection");
exports.escrowBalanceQueue = new bullmq_1.Queue("escrow-balance-queue", { connection: redisConnection_1.connection });
