import { Request, Response, NextFunction } from "express";
import Redis from "ioredis";
import { redisClient } from "../redis/init.redis";

// Initialize Redis client
const redis = redisClient.generic

// Middleware to check Redis availability
export const checkRedis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await redis.ping(); // Ping Redis to check connection
    next(); // Proceed if Redis is available
  } catch (error:any) {
    console.error("Redis server is down:", error.message);
    //Notify Developer that redis service is down
    res.status(503).json({ message: "Service Unavailable: Services are undergoing maintainance" });
  }
};
