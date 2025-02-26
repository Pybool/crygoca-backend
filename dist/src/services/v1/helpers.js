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
exports.formatTimestamp = exports.generateReferralCode = exports.generateShortTimestamp = exports.generateReferenceCode = exports.disconnectDatabase = void 0;
const logger_1 = __importDefault(require("../../bootstrap/logger"));
const accounts_model_1 = __importDefault(require("../../models/accounts.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const crypto = require("crypto");
/**
 * Disconnects the MongoDB connection gracefully.
 */
function disconnectDatabase() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield mongoose_1.default.connection.close(); // Close all active connections
            logger_1.default.info("MongoDB connection closed successfully.");
        }
        catch (error) {
            logger_1.default.error("Error closing MongoDB connection:", error);
        }
    });
}
exports.disconnectDatabase = disconnectDatabase;
// Helper method to generate a random alphanumeric string of a given length
function generateRandomString(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    const randomBytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
        const randomValue = randomBytes[i] % characters.length;
        result += characters[randomValue];
    }
    return result;
}
function generateReferenceCode(prefix = "CR-") {
    const randomString = generateRandomString(8);
    const timestamp = Date.now().toString(36).slice(-4);
    return (prefix + randomString + timestamp).toUpperCase();
}
exports.generateReferenceCode = generateReferenceCode;
const generateShortTimestamp = () => {
    // Get the current timestamp in seconds
    const timestamp = Math.floor(Date.now() / 1000);
    // Convert to Base36 and ensure it's uppercase
    const base36Timestamp = timestamp.toString(36).toUpperCase();
    // Calculate the number of random characters needed
    const randomCharsLength = Math.max(8 - base36Timestamp.length, 0);
    // Generate random characters
    const randomChars = Math.random()
        .toString(36)
        .substring(2, 2 + randomCharsLength)
        .toUpperCase();
    // Combine the timestamp and random characters
    return (base36Timestamp + randomChars).substring(0, 8);
};
exports.generateShortTimestamp = generateShortTimestamp;
const generateReferralCode = (userReference) => __awaiter(void 0, void 0, void 0, function* () {
    const minLength = 8;
    const maxLength = 10;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const generateCode = () => {
        let referralCode = userReference.substring(0, Math.min(4, minLength)).toUpperCase(); // Take up to the first 4 characters of userReference
        // Calculate the length of the random part to ensure total length is between minLength and maxLength
        const randomPartLength = Math.max(minLength - referralCode.length, 0);
        for (let i = 0; i < randomPartLength; i++) {
            const randomIndex = Math.floor(Math.random() * chars.length);
            referralCode += chars[randomIndex];
        }
        // If referralCode exceeds maxLength, truncate it
        if (referralCode.length > maxLength) {
            referralCode = referralCode.substring(0, maxLength);
        }
        return referralCode.toUpperCase();
    };
    try {
        let referralCode = generateCode();
        let attempts = 0;
        const MAX_ATTEMPTS = 10;
        while (attempts < MAX_ATTEMPTS) {
            const alreadyExists = yield accounts_model_1.default.findOne({ referralCode });
            if (!alreadyExists) {
                return referralCode; // Unique referral code found
            }
            // Generate a new code and retry
            referralCode = generateCode();
            attempts++;
        }
        return (0, exports.generateShortTimestamp)();
    }
    catch (_a) {
        return (0, exports.generateShortTimestamp)();
    }
});
exports.generateReferralCode = generateReferralCode;
function formatTimestamp(timestamp) {
    // Create a Date object from the given timestamp
    const date = new Date(timestamp);
    // Define the formatting options
    const options = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true, // To use 12-hour format with AM/PM
    };
    // Create a formatter with the given options
    const formatter = new Intl.DateTimeFormat("en-US", options);
    // Format and return the date
    return formatter.format(date);
}
exports.formatTimestamp = formatTimestamp;
