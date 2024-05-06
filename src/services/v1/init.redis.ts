import { Redis } from "ioredis";
import REDIS_CONNECTION_CONFIG from "../../redis/connection";

export const redisClient = {
  generic: new Redis(REDIS_CONNECTION_CONFIG.generic as any)
};
