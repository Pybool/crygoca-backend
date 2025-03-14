import { redisClient } from "../../../redis/init.redis";
import mongoose from "mongoose";
import { WalletNotificationService } from "./wallet-notifications.service";
import logger from "../../../bootstrap/logger";
import { getTestConfig, updateTestConfig } from "../../../../config";
import { Wallet } from "../../../models/wallet.model";

const redis = redisClient.generic;
/**
 * Stores a rollback action in Redis.
 * @param id - Unique rollback ID
 * @param actionType - e.g., "DELETE"
 * @param collectionName - MongoDB collection name
 * @param query - The query object to undo the operation
 */
export async function registerRollback(
  id: string,
  actionType: string,
  collectionName: string,
  query: Record<string, any>,
  operation?: Record<any, any>
) {
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
    logger.info(`Rollback action registered: ${id}`);
  } catch (error: any) {
    console.error("Failed to register rollback action:", error.message);
  }
}

/**
 * Retrieves a rollback action from Redis by ID.
 * @param id - The unique rollback action ID.
 * @returns The rollback action object or null if not found.
 */
export async function getRollbackById(id: string): Promise<Record<string, any> | null> {
    try {
      const rollbackData = await redis.hget("rollback_actions", id);
      return rollbackData ? JSON.parse(rollbackData) : null;
    } catch (error:any) {
      console.error(`Failed to retrieve rollback action for ID ${id}:`, error.message);
      return null;
    }
  }

export async function processRollbacks() {
  try {
    const rollbackActions = await redis.hgetall("rollback_actions");

    for (const [id, actionData] of Object.entries(rollbackActions)) {
      const rollback = JSON.parse(actionData);

      try {
        const collection = mongoose.connection.collection(rollback.collectionName);
        if (rollback.actionType === "DELETE") {
          await collection.deleteOne(rollback.query);
        }
        if (rollback.actionType === "NOTIFICATION") {
          await WalletNotificationService.createCreditNotification(
            rollback.query.wallet,
            rollback.query.walletTransaction!,
            rollback.query.isRollBack
          );
        }
        // You can add more rollback types (e.g., "UPDATE", "INSERT")

        logger.info(
          `Rollback executed: ${rollback.actionType} on ${rollback.collectionName}`
        );

        // Remove successfully executed rollback action from Redis
        await redis.hdel("rollback_actions", id);
      } catch (error: any) {
        await redis.hdel("rollback_actions", id);
        console.error(`Rollback failed for ${id}:`, error.message);
      }
    }
    logger.info("All operations were rolled back.");
  } catch (error: any) {
    logger.error("Error processing rollbacks:", error.message);
  }
}
