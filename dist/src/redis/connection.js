"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
(0, dotenv_1.config)({ path: `.env.${process.env.NODE_ENV}` });
exports.default = {
    generic: {
        host: process.env.CRYGOCA_REDIS_HOST,
        port: parseInt(process.env.CRYGOCA_REDIS_GENERIC_PORT),
        password: process.env.REDIS_PASSWORD
    }
};
