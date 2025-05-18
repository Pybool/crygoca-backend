"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WithdrawalStatusQueue = void 0;
const init_redis_1 = require("../../../redis/init.redis");
class WithdrawalStatusQueue {
    constructor() {
        this.redis = init_redis_1.redisClient.generic;
    }
    async enqueue(item) {
        await this.redis.lpush("withdrawal_status", JSON.stringify(item)); // Add to the left side (front)
    }
    async dequeue() {
        return this.redis.rpop("withdrawal_status"); // Remove from the right side (end)
    }
    async size() {
        return this.redis.llen("withdrawal_status"); // Get the size of the queue
    }
    // Peek at the first item in the queue without removing it
    async peek() {
        return this.redis.lindex("withdrawal_status", 0); // Get the item at index 0 (front of the queue)
    }
    // Remove and return the first item (front) from the queue
    async removeFirst() {
        return this.redis.lpop("withdrawal_status"); // Remove from the left side (front)
    }
    async clear() {
        await this.redis.del("withdrawal_status"); // Clear the queue
    }
}
exports.WithdrawalStatusQueue = WithdrawalStatusQueue;
