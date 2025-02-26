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
exports.WithdrawalStatusQueue = void 0;
const init_redis_1 = require("../../../redis/init.redis");
class WithdrawalStatusQueue {
    constructor() {
        this.redis = init_redis_1.redisClient.generic;
    }
    enqueue(item) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.redis.lpush("withdrawal_status", JSON.stringify(item)); // Add to the left side (front)
        });
    }
    dequeue() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.redis.rpop("withdrawal_status"); // Remove from the right side (end)
        });
    }
    size() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.redis.llen("withdrawal_status"); // Get the size of the queue
        });
    }
    // Peek at the first item in the queue without removing it
    peek() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.redis.lindex("withdrawal_status", 0); // Get the item at index 0 (front of the queue)
        });
    }
    // Remove and return the first item (front) from the queue
    removeFirst() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.redis.lpop("withdrawal_status"); // Remove from the left side (front)
        });
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.redis.del("withdrawal_status"); // Clear the queue
        });
    }
}
exports.WithdrawalStatusQueue = WithdrawalStatusQueue;
