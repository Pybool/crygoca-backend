"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTimestamp = exports.generateReferenceCode = void 0;
const crypto = require("crypto");
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
