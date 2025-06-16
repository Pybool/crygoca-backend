"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAddressFromPV = exports.decryptDataString = exports.encryptDataString = exports.decryptOnce = exports.encryptOnce = exports.formatTimestamp = exports.generateReferralCode = exports.generateShortTimestamp = exports.generateReferenceCode = exports.disconnectDatabase = void 0;
const logger_1 = __importDefault(require("../../bootstrap/logger"));
const accounts_model_1 = __importDefault(require("../../models/accounts.model"));
const mongoose_1 = __importDefault(require("mongoose"));
const crypto = __importStar(require("crypto"));
const { Wallet } = require("ethers");
const rcrypto = require("crypto");
const CRYGOCA_DATA_ENCRYPTION_KEY = new Uint8Array(Buffer.from(process.env.CRYGOCA_DATA_ENCRYPTION_KEY, "hex"));
const IV_LENGTH = 16;
const depth = Number(process.env.ENC_DEPTH || "1");
/**
 * Disconnects the MongoDB connection gracefully.
 */
async function disconnectDatabase() {
    try {
        await mongoose_1.default.connection.close(); // Close all active connections
        logger_1.default.info("MongoDB connection closed successfully.");
    }
    catch (error) {
        logger_1.default.error("Error closing MongoDB connection:", error);
    }
}
exports.disconnectDatabase = disconnectDatabase;
// Helper method to generate a random alphanumeric string of a given length
function generateRandomString(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    const randomBytes = rcrypto.randomBytes(length);
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
const generateReferralCode = async (userReference) => {
    const minLength = 8;
    const maxLength = 10;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const generateCode = () => {
        let referralCode = userReference
            .substring(0, Math.min(4, minLength))
            .toUpperCase(); // Take up to the first 4 characters of userReference
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
            const alreadyExists = await accounts_model_1.default.findOne({ referralCode });
            if (!alreadyExists) {
                return referralCode; // Unique referral code found
            }
            // Generate a new code and retry
            referralCode = generateCode();
            attempts++;
        }
        return (0, exports.generateShortTimestamp)();
    }
    catch {
        return (0, exports.generateShortTimestamp)();
    }
};
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
function encryptOnce(dataString) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const algorithm = "aes-256-gcm";
    const cipher = crypto.createCipheriv(algorithm, CRYGOCA_DATA_ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(dataString, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag(); // Get the auth tag after encryption
    // Return iv:encrypted:authTag, all hex encoded
    return `${iv.toString("hex")}:${encrypted}:${authTag.toString("hex")}`;
}
exports.encryptOnce = encryptOnce;
function decryptOnce(encryptedData) {
    const [ivHex, encrypted, authTagHex] = encryptedData.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const algorithm = "aes-256-gcm";
    const decipher = crypto.createDecipheriv(algorithm, CRYGOCA_DATA_ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
exports.decryptOnce = decryptOnce;
function encryptDataString(dataString, depth = 1) {
    let result = dataString;
    for (let i = 0; i < depth; i++) {
        result = encryptOnce(result);
    }
    return result;
}
exports.encryptDataString = encryptDataString;
function decryptDataString(encryptedData, depth = 1) {
    let result = encryptedData;
    for (let i = 0; i < depth; i++) {
        result = decryptOnce(result);
    }
    return result;
}
exports.decryptDataString = decryptDataString;
function getAddressFromPV() {
    // Given private key (64 chars, no 0x)
    const privateKey = decryptDataString("cd0f69ca470a7ef759a1151828ada806:0edc6c13a3776e647c3e18e6c50813c1cecc0f8c5b25200658cfc58eb9cc1cf833de5201895b02f38eba6161b80a72e9a8137afb2f2a3de0e71835f5eb5d58836d39:024a3bc4a05c357c03e11a144c460a97", 1);
    // With ethers:
    console.log(privateKey);
    const wallet = new Wallet(privateKey);
    console.log("Wallet address ", wallet.address, wallet); // 0x627306090abaB3A6e1400e9345bC60c78a8BEf57
}
exports.getAddressFromPV = getAddressFromPV;
getAddressFromPV();
// caa27abf406452fd31096ff604dbc794:890b330ede450b2b76275ce05b1dc16157acdf1eca60ac902dcf26ef6ff8b4a6ec670003db6a7a19ddec8f4c8912261ad5eac44ab858d8049d749b90dc04e5dcabd4852df854b84108ddbd8e877ffd90f60529bf649cceb1ca649fdb914880d5e9316e0058a8b00ed6f12a59fb53265ffa487f8e0d953e6a09eff03bc80e7bdd33ce8ea3f890362e00715147591c5e3fc9c5bc81daf4968946d0b8242980cc2bfb87ce75ef849a2819d3786260e79c0f173d89c33d61454ab4c412ab945cd7a04ee726faa2502fd331e7d4d766880db04ead9d3d7e14e30fb29296a1ee7f0748d1a134ce4d217ce6420ac13f898466665cf10b670a52b5ea965d8f93de5c300bd5097c4ed87c998c54b9e2a6ea63360f742851490582fa58e9ffa360f326180c22e2c3330c7c54f730758f1aff33f6131dff99c20186e4f769872ca877d7ee4c0fcab8b0528c853df699a06e4cfaa95d6783e2f2d787a893898fe5552b0ffbcf29b8167040f106154190f93bb496ff969b0839a9f395f93bd358291aec0a70218433417b8b36c2b335f40aba01e07db284d0ef7337f711323ce0870a0f212070d445a714c2a5097fc7fb7d10810ddd4e360effde7843f7267be7f547dd05ecb22242311cfaf03f0f298025519c70efd7485fb5e63c6340b75c543f73c1573698b9286364f49720b6183375678ca46bcd14e54b0d8e8ae20bf79a48c47533580179a3f6f0441a9323bd358bdc51b93fd9e8430c5bd934faa5435e1072852e608678c9db97ad8850a12ed8b71bbeb49d7907cbacb6193b0d29ac588f518a5a214660b54e91a4150fcbdcc9a9c2fe7ef4a61baa17066f6b43adef34441db65636603b95c73ff764199b27614c36a4bec33147316d5c18f9003e00e45932ec93c12dfbe30563bdf5e0c39058bc84df561d28bf6952d6aec0758bb5ac836019eb498b03ae7000c7fef3e394bb24bd06afdf78fad707b9726a259b47168badf482a4afdf320ba62a545cf2eea3233443c97f1d5d6bd311f3153627b7a53644669c98b85510b22540b7527aec193331fb4df2074446ea0783355bba59d163654a886c0ea19e7da5f656418abdfdc56dc88c34b5b3559afd36da1c0b80eb8cd4857e83f66afe473bc8230c6e95c0cc541dd94794c24bff49355bfe4de866bd4ea9cd9456173cff7e7cbaa10f2c7deac99d3751118f8d82ca7fe17dc4f4395eb27ec05b6c76182ea2cd43eddc7b7a7ac0634ccd276e335efdb2c486f31de05e903ca84f739e015351cd85a7e332e9b05bfc01f0e942bff9c966a759da6d777540840c6935692f8f28bd20f2ef83ee67d26cfb5c26d978ea468dd10da68d1caf69518505fd5bdaa966857b0426d62ee946a81ec7a343f13ca4b133aeeabe05ff93b390:9161865b54db8de7f6fb4e92ff95d4c8
