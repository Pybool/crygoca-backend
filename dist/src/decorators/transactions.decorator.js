"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongooseTransaction = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_1 = require("mongodb"); // Import ClientSession from mongodb
/**
 * Generic transaction decorator that:
 * - Starts a transaction
 * - Passes session automatically to all Mongoose queries
 * - Commits on success, rolls back on failure
 */
function MongooseTransaction() {
    return function (target, propertyKey, descriptor) {
        // ✅ For class methods
        if (descriptor) {
            const originalMethod = descriptor.value;
            descriptor.value = async function (...args) {
                let session = args.find(arg => arg instanceof mongodb_1.ClientSession) || null;
                // Start a new session only if one doesn't exist
                if (!session) {
                    session = await mongoose_1.default.startSession();
                    session.startTransaction();
                    args.push(session); // Pass the session to the original function
                }
                try {
                    const result = await originalMethod.apply(this, args);
                    await session.commitTransaction();
                    return result;
                }
                catch (error) {
                    await session.abortTransaction();
                    return {
                        status: false,
                        message: "Database transaction failed.",
                        error: error?.message
                    };
                }
                finally {
                    session.endSession();
                }
            };
            return descriptor;
        }
        // ❌ TypeScript does not support decorators on standalone functions.
        // ✅ Wrap standalone functions manually when exporting them.
    };
}
exports.MongooseTransaction = MongooseTransaction;
