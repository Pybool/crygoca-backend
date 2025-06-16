"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizePhoneNumber = exports.deleteExpirableCode = exports.makePassword = exports.generateOtp = exports.getExpirableAccountData = exports.getExpirableCode = exports.setExpirableAccountData = exports.getExpirablePhoneCode = exports.setExpirablePhoneCode = exports.setExpirableCode = exports.generatePasswordResetHash = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const init_redis_1 = require("../../../redis/init.redis");
const crypto = require("crypto");
const gredisClient = init_redis_1.redisClient.generic;
function generatePasswordResetHash(email, number) {
    // Combine email and number into a single string
    const input = `${email}:${number}`;
    // Create a SHA-256 hash using the input string
    const hash = crypto.createHash("sha256");
    // Update the hash with the input
    hash.update(input);
    // Return the hash as a hexadecimal string
    return hash.digest("hex");
}
exports.generatePasswordResetHash = generatePasswordResetHash;
const setExpirableCode = async (email, prefix, code, EXP = 300) => {
    const cacheKey = prefix + email;
    await gredisClient.set(cacheKey, JSON.stringify({ email: email, code: code }), "EX", EXP);
};
exports.setExpirableCode = setExpirableCode;
const setExpirablePhoneCode = async (phone, prefix, code, EXP = 300) => {
    const cacheKey = prefix + phone;
    await gredisClient.set(cacheKey, JSON.stringify({ phone: phone, code: code }), "EX", EXP);
};
exports.setExpirablePhoneCode = setExpirablePhoneCode;
const getExpirablePhoneCode = async (prefix, phone) => {
    const cacheKey = prefix + phone;
    const codeCached = await gredisClient.get(cacheKey);
    const ttl = await gredisClient.ttl(cacheKey);
    if (codeCached !== null && ttl >= 0) {
        return JSON.parse(codeCached);
    }
    else {
        await gredisClient.del(cacheKey);
        return null;
    }
};
exports.getExpirablePhoneCode = getExpirablePhoneCode;
const setExpirableAccountData = async (email, prefix, data, EXP = 300) => {
    try {
        const cacheKey = prefix + email;
        await gredisClient.set(cacheKey, JSON.stringify(data), "EX", EXP);
        return true;
    }
    catch {
        return false;
    }
};
exports.setExpirableAccountData = setExpirableAccountData;
const getExpirableCode = async (prefix, email) => {
    const cacheKey = prefix + email;
    const codeCached = await gredisClient.get(cacheKey);
    const ttl = await gredisClient.ttl(cacheKey);
    if (codeCached !== null && ttl >= 0) {
        return JSON.parse(codeCached);
    }
    else {
        await gredisClient.del(cacheKey);
        return null;
    }
};
exports.getExpirableCode = getExpirableCode;
const getExpirableAccountData = async (prefix, email) => {
    const cacheKey = prefix + email;
    const accountDataCached = await gredisClient.get(cacheKey);
    const ttl = await gredisClient.ttl(cacheKey);
    if (accountDataCached !== null && ttl >= 0) {
        return JSON.parse(accountDataCached);
    }
    else {
        await gredisClient.del(cacheKey);
        return null;
    }
};
exports.getExpirableAccountData = getExpirableAccountData;
const generateOtp = () => {
    const otp = Math.floor(1000 + Math.random() * 9000);
    return otp.toString();
};
exports.generateOtp = generateOtp;
async function makePassword(password) {
    try {
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        return hashedPassword;
    }
    catch (error) {
        throw error;
    }
}
exports.makePassword = makePassword;
const deleteExpirableCode = async (key) => {
    await gredisClient.del(key);
};
exports.deleteExpirableCode = deleteExpirableCode;
// Function to normalize phone numbers
const normalizePhoneNumber = (countryCode, phone) => {
    const dialCode = countryCode;
    if (!dialCode) {
        throw new Error("Invalid country code");
    }
    // Remove all non-numeric characters
    let normalizedPhone = phone.replace(/\D/g, "");
    // If the phone number starts with '0', replace it with the dial code
    if (normalizedPhone.startsWith("0")) {
        normalizedPhone = dialCode + normalizedPhone.slice(1);
    }
    // If the phone number doesn't start with the dial code, prepend it
    if (!normalizedPhone.startsWith(dialCode)) {
        normalizedPhone = dialCode + normalizedPhone;
    }
    return normalizedPhone;
};
exports.normalizePhoneNumber = normalizePhoneNumber;
// export const getGeolocation = (req: Xrequest) => {
//   let ipAddress = req.ip!
//   if (ipAddress.startsWith('::ffff:')) {
//     ipAddress = ipAddress.substr(7);
//   }
//   return new Promise((rs: any, rj: any) => {
//     const geo = geoip.lookup(ipAddress);
//     if (geo && geo.ll) {
//       const latitude = geo.ll[0];
//       const longitude = geo.ll[1];
//       rs({
//         latitude,
//         longitude,
//       });
//     } else {
//       rs(null);
//     }
//   });
// };
