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
exports.deleteExpirableCode = exports.makePassword = exports.generateOtp = exports.getExpirableAccountData = exports.getExpirableCode = exports.setExpirableAccountData = exports.setExpirableCode = exports.generatePasswordResetHash = void 0;
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
const setExpirableCode = (email_1, prefix_1, code_1, ...args_1) => __awaiter(void 0, [email_1, prefix_1, code_1, ...args_1], void 0, function* (email, prefix, code, EXP = 300) {
    const cacheKey = prefix + email;
    yield gredisClient.set(cacheKey, JSON.stringify({ email: email, code: code }), "EX", EXP);
});
exports.setExpirableCode = setExpirableCode;
const setExpirableAccountData = (email_2, prefix_2, data_1, ...args_2) => __awaiter(void 0, [email_2, prefix_2, data_1, ...args_2], void 0, function* (email, prefix, data, EXP = 300) {
    try {
        const cacheKey = prefix + email;
        yield gredisClient.set(cacheKey, JSON.stringify(data), "EX", EXP);
        return true;
    }
    catch (_a) {
        return false;
    }
});
exports.setExpirableAccountData = setExpirableAccountData;
const getExpirableCode = (prefix, email) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheKey = prefix + email;
    const codeCached = yield gredisClient.get(cacheKey);
    const ttl = yield gredisClient.ttl(cacheKey);
    if (codeCached !== null && ttl >= 0) {
        return JSON.parse(codeCached);
    }
    else {
        yield gredisClient.del(cacheKey);
        return null;
    }
});
exports.getExpirableCode = getExpirableCode;
const getExpirableAccountData = (prefix, email) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheKey = prefix + email;
    const accountDataCached = yield gredisClient.get(cacheKey);
    const ttl = yield gredisClient.ttl(cacheKey);
    if (accountDataCached !== null && ttl >= 0) {
        return JSON.parse(accountDataCached);
    }
    else {
        yield gredisClient.del(cacheKey);
        return null;
    }
});
exports.getExpirableAccountData = getExpirableAccountData;
const generateOtp = () => {
    const otp = Math.floor(1000 + Math.random() * 9000);
    return otp.toString();
};
exports.generateOtp = generateOtp;
function makePassword(password) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const salt = yield bcryptjs_1.default.genSalt(10);
            const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
            return hashedPassword;
        }
        catch (error) {
            throw error;
        }
    });
}
exports.makePassword = makePassword;
const deleteExpirableCode = (key) => __awaiter(void 0, void 0, void 0, function* () {
    yield gredisClient.del(key);
});
exports.deleteExpirableCode = deleteExpirableCode;
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
