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
exports.checkRedis = void 0;
const init_redis_1 = require("../redis/init.redis");
// Initialize Redis client
const redis = init_redis_1.redisClient.generic;
// Middleware to check Redis availability
const checkRedis = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield redis.ping(); // Ping Redis to check connection
        next(); // Proceed if Redis is available
    }
    catch (error) {
        console.error("Redis server is down:", error.message);
        //Notify Developer that redis service is down
        res.status(503).json({ message: "Service Unavailable: Services are undergoing maintainance" });
    }
});
exports.checkRedis = checkRedis;
