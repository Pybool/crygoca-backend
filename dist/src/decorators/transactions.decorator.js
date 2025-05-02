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
            descriptor.value = function (...args) {
                return __awaiter(this, void 0, void 0, function* () {
                    let session = args.find(arg => arg instanceof mongodb_1.ClientSession) || null;
                    // Start a new session only if one doesn't exist
                    if (!session) {
                        session = yield mongoose_1.default.startSession();
                        session.startTransaction();
                        args.push(session); // Pass the session to the original function
                    }
                    try {
                        const result = yield originalMethod.apply(this, args);
                        yield session.commitTransaction();
                        return result;
                    }
                    catch (error) {
                        yield session.abortTransaction();
                        return {
                            status: false,
                            message: "Database transaction failed.",
                            error: error === null || error === void 0 ? void 0 : error.message
                        };
                    }
                    finally {
                        session.endSession();
                    }
                });
            };
            return descriptor;
        }
        // ❌ TypeScript does not support decorators on standalone functions.
        // ✅ Wrap standalone functions manually when exporting them.
    };
}
exports.MongooseTransaction = MongooseTransaction;
