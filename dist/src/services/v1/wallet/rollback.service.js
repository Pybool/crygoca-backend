"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processRollbacks = exports.getRollbackById = exports.registerRollback = void 0;
const init_redis_1 = require("../../../redis/init.redis");
const mongoose_1 = __importDefault(require("mongoose"));
const wallet_notifications_service_1 = require("./wallet-notifications.service");
const logger_1 = __importDefault(require("../../../bootstrap/logger"));
const redis = init_redis_1.redisClient.generic;
/**
 * Stores a rollback action in Redis.
 * @param id - Unique rollback ID
 * @param actionType - e.g., "DELETE"
 * @param collectionName - MongoDB collection name
 * @param query - The query object to undo the operation
 */
async function registerRollback(id, actionType, collectionName, query, operation) {
    const rollbackAction = {
        actionType,
        collectionName,
        query,
        operation,
    };
    try {
        // if (getTestConfig().DISCONNECT_DATABASE === "true") {
        //     const ids:any = getTestConfig()?.failedTransactionIds || []
        //     ids.push(id)
        //     updateTestConfig("failedTransactionIds", ids);
        // }
        await redis.hset("rollback_actions", id, JSON.stringify(rollbackAction));
        logger_1.default.info(`Rollback action registered: ${id}`);
    }
    catch (error) {
        console.error("Failed to register rollback action:", error.message);
    }
}
exports.registerRollback = registerRollback;
/**
 * Retrieves a rollback action from Redis by ID.
 * @param id - The unique rollback action ID.
 * @returns The rollback action object or null if not found.
 */
async function getRollbackById(id) {
    try {
        const rollbackData = await redis.hget("rollback_actions", id);
        return rollbackData ? JSON.parse(rollbackData) : null;
    }
    catch (error) {
        console.error(`Failed to retrieve rollback action for ID ${id}:`, error.message);
        return null;
    }
}
exports.getRollbackById = getRollbackById;
async function processRollbacks() {
    try {
        const rollbackActions = await redis.hgetall("rollback_actions");
        for (const [id, actionData] of Object.entries(rollbackActions)) {
            const rollback = JSON.parse(actionData);
            try {
                const collection = mongoose_1.default.connection.collection(rollback.collectionName);
                if (rollback.actionType === "DELETE") {
                    await collection.deleteOne(rollback.query);
                }
                if (rollback.actionType === "NOTIFICATION") {
                    await wallet_notifications_service_1.WalletNotificationService.createCreditNotification(rollback.query.wallet, rollback.query.walletTransaction, rollback.query.isRollBack);
                }
                // You can add more rollback types (e.g., "UPDATE", "INSERT")
                logger_1.default.info(`Rollback executed: ${rollback.actionType} on ${rollback.collectionName}`);
                // Remove successfully executed rollback action from Redis
                await redis.hdel("rollback_actions", id);
            }
            catch (error) {
                await redis.hdel("rollback_actions", id);
                console.error(`Rollback failed for ${id}:`, error.message);
            }
        }
        logger_1.default.info("All operations were rolled back.");
    }
    catch (error) {
        logger_1.default.error("Error processing rollbacks:", error.message);
    }
}
exports.processRollbacks = processRollbacks;
