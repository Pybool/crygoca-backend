"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    generic: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_GENERIC_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
    }
};
