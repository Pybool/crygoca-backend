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
function registerRollback(id, actionType, collectionName, query, operation) {
    return __awaiter(this, void 0, void 0, function* () {
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
            yield redis.hset("rollback_actions", id, JSON.stringify(rollbackAction));
            logger_1.default.info(`Rollback action registered: ${id}`);
        }
        catch (error) {
            console.error("Failed to register rollback action:", error.message);
        }
    });
}
exports.registerRollback = registerRollback;
/**
 * Retrieves a rollback action from Redis by ID.
 * @param id - The unique rollback action ID.
 * @returns The rollback action object or null if not found.
 */
function getRollbackById(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const rollbackData = yield redis.hget("rollback_actions", id);
            return rollbackData ? JSON.parse(rollbackData) : null;
        }
        catch (error) {
            console.error(`Failed to retrieve rollback action for ID ${id}:`, error.message);
            return null;
        }
    });
}
exports.getRollbackById = getRollbackById;
function processRollbacks() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const rollbackActions = yield redis.hgetall("rollback_actions");
            for (const [id, actionData] of Object.entries(rollbackActions)) {
                const rollback = JSON.parse(actionData);
                try {
                    const collection = mongoose_1.default.connection.collection(rollback.collectionName);
                    if (rollback.actionType === "DELETE") {
                        yield collection.deleteOne(rollback.query);
                    }
                    if (rollback.actionType === "NOTIFICATION") {
                        yield wallet_notifications_service_1.WalletNotificationService.createCreditNotification(rollback.query.wallet, rollback.query.walletTransaction, rollback.query.isRollBack);
                    }
                    // You can add more rollback types (e.g., "UPDATE", "INSERT")
                    logger_1.default.info(`Rollback executed: ${rollback.actionType} on ${rollback.collectionName}`);
                    // Remove successfully executed rollback action from Redis
                    yield redis.hdel("rollback_actions", id);
                }
                catch (error) {
                    yield redis.hdel("rollback_actions", id);
                    console.error(`Rollback failed for ${id}:`, error.message);
                }
            }
            logger_1.default.info("All operations were rolled back.");
        }
        catch (error) {
            logger_1.default.error("Error processing rollbacks:", error.message);
        }
    });
}
exports.processRollbacks = processRollbacks;
