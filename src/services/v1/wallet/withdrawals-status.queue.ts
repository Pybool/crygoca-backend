import * as Redis from "ioredis";
import { redisClient } from "../../../redis/init.redis";

export class WithdrawalStatusQueue<T> {
    private redis: Redis.Redis;
  
    constructor() {
      this.redis = redisClient.generic;
    }
  
    async enqueue(item: T): Promise<void> {
      await this.redis.lpush("withdrawal_status", JSON.stringify(item)); // Add to the left side (front)
    }
  
    async dequeue(): Promise<string | null> {
      return this.redis.rpop("withdrawal_status"); // Remove from the right side (end)
    }
  
    async size(): Promise<number> {
      return this.redis.llen("withdrawal_status"); // Get the size of the queue
    }
  
    // Peek at the first item in the queue without removing it
    async peek(): Promise<string | null> {
      return this.redis.lindex("withdrawal_status", 0); // Get the item at index 0 (front of the queue)
    }
  
    // Remove and return the first item (front) from the queue
    async removeFirst(): Promise<string | null> {
      return this.redis.lpop("withdrawal_status"); // Remove from the left side (front)
    }
  
    async clear(): Promise<void> {
      await this.redis.del("withdrawal_status"); // Clear the queue
    }
  }