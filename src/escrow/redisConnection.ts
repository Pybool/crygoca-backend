import { RedisOptions } from "bullmq";
import { createClient } from "redis";

export const redisHost = process.env.REDIS_HOST || "127.0.0.1";
export const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);

export const connection: RedisOptions = {
  host: redisHost,
  port: redisPort,
};

// Optional: create and export a Redis client (useful for other parts of app)
export const redisClient = createClient({
  socket: {
    host: redisHost,
    port: redisPort,
  },
});

redisClient.on("error", (err) => {
  console.error("Redis Client Error", err);
});

(async () => {
  await redisClient.connect();
})();
