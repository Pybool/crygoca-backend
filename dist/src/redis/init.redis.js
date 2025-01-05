"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const ioredis_1 = require("ioredis");
const connection_1 = __importDefault(require("./connection"));
exports.redisClient = {
    generic: new ioredis_1.Redis(connection_1.default.generic),
};
