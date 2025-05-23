"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletFailedtasksHandler = void 0;
const jobsFailureRegistry_model_1 = __importDefault(require("../../../models/jobsFailureRegistry.model"));
const init_redis_1 = require("../../../redis/init.redis");
const minitaskscheduler_1 = require("../minitaskscheduler");
const gRedisClient = init_redis_1.redisClient.generic;
const scheduler = new minitaskscheduler_1.PeriodicTaskScheduler();
const t_scheduler = new minitaskscheduler_1.ThreadedPeriodicTaskScheduler();
class WalletFailedtasksHandler {
    static async registerfailedJob(type, amount, meta) {
        try {
            // Check the failure registry in MongoDB
            console.log("Meta ", meta);
            let registryEntry = await jobsFailureRegistry_model_1.default.findOne({
                uuid: meta.verifiedTransactionId?.toString(),
            });
            if (!registryEntry) {
                // Add a new entry to the failure registry
                await jobsFailureRegistry_model_1.default.create({
                    uuid: meta.verifiedTransactionId,
                    type,
                    meta,
                    amount,
                    status: "manual-resolve",
                    cycleCount: 1,
                    createdAt: new Date()
                });
                return true;
            }
        }
        catch (dbError) {
            console.error(`Database error occurred: ${dbError.message}. Falling back to Redis.`);
            // Use Redis as a fallback for failed job tracking
            const redisKey = `wallet_failure_registry:${meta.verifiedTransactionId}`;
            const redisEntry = await gRedisClient.get(redisKey);
            if (!redisEntry) {
                await gRedisClient.set(redisKey, JSON.stringify({
                    verifiedTransactionId: meta.verifiedTransactionId,
                    type,
                    meta,
                    amount,
                    cycleCount: 1,
                    status: "manual-resolve",
                }), "EX", 60 * 60 * 48 // Optional TTL: 2 days
                );
                return true;
            }
        }
    }
    static async syncRedisToDatabase() {
        const keys = await gRedisClient.keys("wallet_failure_registry:*");
        for (const key of keys) {
            const redisEntry = await gRedisClient.get(key);
            if (redisEntry) {
                const entry = JSON.parse(redisEntry);
                try {
                    // Check if the entry exists in the database
                    let registryEntry = await jobsFailureRegistry_model_1.default.findOne({
                        verifiedTransactionId: entry.verifiedTransactionId,
                    });
                    if (registryEntry) {
                        registryEntry.cycleCount = entry.cycleCount;
                        registryEntry.status = entry.status;
                        await registryEntry.save();
                    }
                    else {
                        // Create a new entry in the database
                        await jobsFailureRegistry_model_1.default.create(entry);
                    }
                    // Remove the entry from Redis after syncing
                    await gRedisClient.del(key);
                }
                catch (dbError) {
                    console.error(`Failed to sync entry ${entry.verifiedTransactionId} to database: ${dbError.message}`);
                }
            }
        }
        console.log("Redis data synced to the database.");
    }
}
exports.WalletFailedtasksHandler = WalletFailedtasksHandler;
const dbSyncTask = async () => {
    const mongoose = require("mongoose");
    const Redis = require("ioredis");
    const SCHEMA_NAME = "FailureRegistry"; // Schema name for the FailureRegistry
    const REDIS_URL = `redis://${process.env.CRYGOCA_REDIS_HOST}:${process.env.CRYGOCA_REDIS_GENERIC_PORT}`; // Replace with your Redis URL
    const MONGO_URI = process.env.CRYGOCA_MONGODB_URI;
    let gRedisClient = null;
    try {
        // Connect to Redis
        gRedisClient = new Redis(REDIS_URL);
        console.log("Connected to Redis.");
        // Connect to MongoDB
        if (!mongoose.connection.readyState) {
            await mongoose.connect(MONGO_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log("Connected to MongoDB.");
        }
        // Dynamically get the model by schema name
        const failureRegistrySchema = new mongoose.Schema({
            uuid: { type: String, required: false, unique: true },
            type: { type: String, required: true },
            meta: { type: Object, default: null },
            amount: { type: Number, default: 0 },
            cycleCount: { type: Number, default: 0 },
            status: {
                type: String,
                default: "pending",
                enum: ["pending", "manual-resolve"],
            }, // "pending", "manual-resolve"
        });
        // Check if the model is already registered, if not, register it
        let FailureRegistry;
        try {
            FailureRegistry = mongoose.model(SCHEMA_NAME);
        }
        catch (e) {
            // Register model if it is not already registered
            FailureRegistry = mongoose.model(SCHEMA_NAME, failureRegistrySchema);
        }
        // Fetch keys from Redis
        const keys = await gRedisClient.keys("wallet_failure_registry:*");
        for (const key of keys) {
            const redisEntry = await gRedisClient.get(key);
            if (redisEntry) {
                const entry = JSON.parse(redisEntry);
                try {
                    // Check if the entry exists in MongoDB
                    let registryEntry = await FailureRegistry.findOne({
                        uuid: entry.verifiedTransactionId,
                    });
                    if (registryEntry) {
                        registryEntry.cycleCount = entry.cycleCount;
                        registryEntry.status = entry.status;
                        await registryEntry.save();
                    }
                    else {
                        // Create a new entry in MongoDB
                        await FailureRegistry.create(entry);
                    }
                    // Remove the entry from Redis after syncing
                    await gRedisClient.del(key);
                }
                catch (dbError) {
                    console.error(`Failed to sync entry ${entry.verifiedTransactionId}: ${dbError.message}`);
                }
            }
        }
        console.log("Redis data synced to the database.");
    }
    catch (error) {
        console.error(`Error in dbSyncTask: ${error.message}`);
    }
    finally {
        // Close Redis connection
        if (gRedisClient) {
            await gRedisClient.quit();
            console.log("Redis connection closed.");
        }
        // Close MongoDB connection if necessary
        if (mongoose.connection.readyState) {
            await mongoose.disconnect();
            console.log("MongoDB connection closed.");
        }
    }
};
//Sync failures in redis to database every 2 minutes
// Only run in development
if (process.env.NODE_ENV === "dev") {
    scheduler.addTask("sync-wallet-failure-to-databse", WalletFailedtasksHandler.syncRedisToDatabase, 120000);
}
// Only run in production
if (process.env.NODE_ENV === "prod") {
    t_scheduler.addTask("sync-wallet-failure-to-databse", dbSyncTask, 120000);
}
