"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = exports.connection = exports.redisPort = exports.redisHost = void 0;
const redis_1 = require("redis");
exports.redisHost = process.env.REDIS_HOST || "127.0.0.1";
exports.redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);
exports.connection = {
    host: exports.redisHost,
    port: exports.redisPort,
};
// Optional: create and export a Redis client (useful for other parts of app)
exports.redisClient = (0, redis_1.createClient)({
    socket: {
        host: exports.redisHost,
        port: exports.redisPort,
    },
});
exports.redisClient.on("error", (err) => {
    console.error("Redis Client Error", err);
});
(async () => {
    await exports.redisClient.connect();
})();
