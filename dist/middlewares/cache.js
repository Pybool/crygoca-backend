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
    set(key, value, expirationTime) {
        return __awaiter(this, void 0, void 0, function* () {
            const stringValue = JSON.stringify(value); // Serialize the value
            yield this.redisClient.set(key.toString(), stringValue, 'EX', expirationTime);
        });
    }
    /**
     * Gets a value from Redis.
     * @param key - The cache key.
     * @returns The value or null if not found or expired.
     */
    get(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const stringValue = yield this.redisClient.get(key.toString());
            return stringValue ? JSON.parse(stringValue) : null;
        });
    }
    /**
     * Deletes a key from Redis.
     * @param key - The cache key.
     */
    delete(key) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.redisClient.del(key.toString());
        });
    }
    /**
     * Checks if a key exists in Redis.
     * @param key - The cache key.
     * @returns True if the key exists, otherwise false.
     */
    has(key) {
        return __awaiter(this, void 0, void 0, function* () {
            const exists = yield this.redisClient.exists(key.toString());
            return exists === 1;
        });
    }
    /**
     * Clears all keys from the Redis cache.
     */
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.redisClient.flushall();
        });
    }
    /**
     * Gets the number of keys in the Redis cache.
     * @returns The count of keys in the cache.
     */
    size() {
        return __awaiter(this, void 0, void 0, function* () {
            const keys = yield this.redisClient.keys('*');
            return keys.length;
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.redisClient.quit();
        });
    }
}
exports.Cache = Cache;
const cache = new Cache();
// Handle termination signals
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Closing Redis client...");
    yield cache.clear();
    yield cache.close();
    process.exit(0);
}));
