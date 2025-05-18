"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
class Cache {
    constructor() {
        this.redisClient = new ioredis_1.default(); // Defaults to localhost:6379
    }
    /**
     * Sets a value in Redis with an expiration time.
     * @param key - The cache key.
     * @param value - The value to store (any type).
     * @param expirationTime - Expiration time in seconds.
     */
    async set(key, value, expirationTime) {
        const stringValue = JSON.stringify(value); // Serialize the value
        await this.redisClient.set(key.toString(), stringValue, 'EX', expirationTime);
    }
    /**
     * Gets a value from Redis.
     * @param key - The cache key.
     * @returns The value or null if not found or expired.
     */
    async get(key) {
        const stringValue = await this.redisClient.get(key.toString());
        return stringValue ? JSON.parse(stringValue) : null;
    }
    /**
     * Deletes a key from Redis.
     * @param key - The cache key.
     */
    async delete(key) {
        await this.redisClient.del(key.toString());
    }
    /**
     * Checks if a key exists in Redis.
     * @param key - The cache key.
     * @returns True if the key exists, otherwise false.
     */
    async has(key) {
        const exists = await this.redisClient.exists(key.toString());
        return exists === 1;
    }
    /**
     * Clears all keys from the Redis cache.
     */
    async clear() {
        await this.redisClient.flushall();
    }
    /**
     * Gets the number of keys in the Redis cache.
     * @returns The count of keys in the cache.
     */
    async size() {
        const keys = await this.redisClient.keys('*');
        return keys.length;
    }
    async close() {
        await this.redisClient.quit();
    }
}
exports.Cache = Cache;
