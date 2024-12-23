
import Redis from 'ioredis';

export class Cache<T = any> {
  private redisClient: Redis;

  constructor() {
    this.redisClient = new Redis(); // Defaults to localhost:6379
  }

  /**
   * Sets a value in Redis with an expiration time.
   * @param key - The cache key.
   * @param value - The value to store (any type).
   * @param expirationTime - Expiration time in seconds.
   */
  async set(key: string | number, value: T, expirationTime: number): Promise<void> {
    const stringValue = JSON.stringify(value); // Serialize the value
    await this.redisClient.set(key.toString(), stringValue, 'EX', expirationTime);
  }

  /**
   * Gets a value from Redis.
   * @param key - The cache key.
   * @returns The value or null if not found or expired.
   */
  async get(key: string | number): Promise<T | null> {
    const stringValue = await this.redisClient.get(key.toString());
    return stringValue ? JSON.parse(stringValue) : null;
  }

  /**
   * Deletes a key from Redis.
   * @param key - The cache key.
   */
  async delete(key: string | number): Promise<void> {
    await this.redisClient.del(key.toString());
  }

  /**
   * Checks if a key exists in Redis.
   * @param key - The cache key.
   * @returns True if the key exists, otherwise false.
   */
  async has(key: string | number): Promise<boolean> {
    const exists = await this.redisClient.exists(key.toString());
    return exists === 1;
  }

  /**
   * Clears all keys from the Redis cache.
   */
  async clear(): Promise<void> {
    await this.redisClient.flushall();
  }

  /**
   * Gets the number of keys in the Redis cache.
   * @returns The count of keys in the cache.
   */
  async size(): Promise<number> {
    const keys = await this.redisClient.keys('*');
    return keys.length;
  }

  async close(): Promise<void> {
    await this.redisClient.quit();
  }
}


const cache = new Cache();
// Handle termination signals
process.on('SIGINT', async () => {
  console.log("Closing Redis client...");
  await cache.clear();
  await cache.close();
  process.exit(0);
});