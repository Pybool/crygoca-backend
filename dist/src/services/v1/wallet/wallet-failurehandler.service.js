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
exports.WalletFailedtasksHandler = void 0;
const jobsFailureRegistry_model_1 = __importDefault(require("../../../models/jobsFailureRegistry.model"));
const init_redis_1 = require("../../../redis/init.redis");
const minitaskscheduler_1 = require("../minitaskscheduler");
const gRedisClient = init_redis_1.redisClient.generic;
const scheduler = new minitaskscheduler_1.PeriodicTaskScheduler();
const t_scheduler = new minitaskscheduler_1.ThreadedPeriodicTaskScheduler();
class WalletFailedtasksHandler {
    static registerfailedJob(type, amount, meta) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Check the failure registry in MongoDB
                console.log("Meta ", meta);
                let registryEntry = yield jobsFailureRegistry_model_1.default.findOne({
                    uuid: (_a = meta.verifiedTransactionId) === null || _a === void 0 ? void 0 : _a.toString(),
                });
                if (!registryEntry) {
                    // Add a new entry to the failure registry
                    yield jobsFailureRegistry_model_1.default.create({
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
                const redisEntry = yield gRedisClient.get(redisKey);
                if (!redisEntry) {
                    yield gRedisClient.set(redisKey, JSON.stringify({
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
        });
    }
    static syncRedisToDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            const keys = yield gRedisClient.keys("wallet_failure_registry:*");
            for (const key of keys) {
                const redisEntry = yield gRedisClient.get(key);
                if (redisEntry) {
                    const entry = JSON.parse(redisEntry);
                    try {
                        // Check if the entry exists in the database
                        let registryEntry = yield jobsFailureRegistry_model_1.default.findOne({
                            verifiedTransactionId: entry.verifiedTransactionId,
                        });
                        if (registryEntry) {
                            registryEntry.cycleCount = entry.cycleCount;
                            registryEntry.status = entry.status;
                            yield registryEntry.save();
                        }
                        else {
                            // Create a new entry in the database
                            yield jobsFailureRegistry_model_1.default.create(entry);
                        }
                        // Remove the entry from Redis after syncing
                        yield gRedisClient.del(key);
                    }
                    catch (dbError) {
                        console.error(`Failed to sync entry ${entry.verifiedTransactionId} to database: ${dbError.message}`);
                    }
                }
            }
            console.log("Redis data synced to the database.");
        });
    }
}
exports.WalletFailedtasksHandler = WalletFailedtasksHandler;
const dbSyncTask = () => __awaiter(void 0, void 0, void 0, function* () {
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
            yield mongoose.connect(MONGO_URI, {
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
        const keys = yield gRedisClient.keys("wallet_failure_registry:*");
        for (const key of keys) {
            const redisEntry = yield gRedisClient.get(key);
            if (redisEntry) {
                const entry = JSON.parse(redisEntry);
                try {
                    // Check if the entry exists in MongoDB
                    let registryEntry = yield FailureRegistry.findOne({
                        uuid: entry.verifiedTransactionId,
                    });
                    if (registryEntry) {
                        registryEntry.cycleCount = entry.cycleCount;
                        registryEntry.status = entry.status;
                        yield registryEntry.save();
                    }
                    else {
                        // Create a new entry in MongoDB
                        yield FailureRegistry.create(entry);
                    }
                    // Remove the entry from Redis after syncing
                    yield gRedisClient.del(key);
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
            yield gRedisClient.quit();
            console.log("Redis connection closed.");
        }
        // Close MongoDB connection if necessary
        if (mongoose.connection.readyState) {
            yield mongoose.disconnect();
            console.log("MongoDB connection closed.");
        }
    }
});
//Sync failures in redis to database every 2 minutes
// Only run in development
if (process.env.NODE_ENV === "dev") {
    scheduler.addTask("sync-wallet-failure-to-databse", WalletFailedtasksHandler.syncRedisToDatabase, 120000);
}
// Only run in production
if (process.env.NODE_ENV === "prod") {
    t_scheduler.addTask("sync-wallet-failure-to-databse", dbSyncTask, 120000);
}
