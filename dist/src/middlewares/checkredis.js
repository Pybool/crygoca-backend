"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkRedis = void 0;
const init_redis_1 = require("../redis/init.redis");
// Initialize Redis client
const redis = init_redis_1.redisClient.generic;
// Middleware to check Redis availability
const checkRedis = async (req, res, next) => {
    try {
        await redis.ping(); // Ping Redis to check connection
        next(); // Proceed if Redis is available
    }
    catch (error) {
        console.error("Redis server is down:", error.message);
        //Notify Developer that redis service is down
        res.status(503).json({ message: "Service Unavailable: Services are undergoing maintainance" });
    }
};
exports.checkRedis = checkRedis;
