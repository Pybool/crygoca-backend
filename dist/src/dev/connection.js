"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connection = void 0;
const dotenv_1 = require("dotenv");
const { RedisConnection } = require("bullmq");
(0, dotenv_1.config)();
(0, dotenv_1.config)({ path: `.env` });
exports.connection = new RedisConnection({
    host: process.env.CRYGOCA_REDIS_HOST,
    port: parseInt(process.env.CRYGOCA_REDIS_GENERIC_PORT),
    password: process.env.REDIS_PASSWORD
});
