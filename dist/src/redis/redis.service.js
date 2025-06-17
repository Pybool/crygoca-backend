"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccountData = exports.getAccountData = exports.setAccountData = void 0;
const init_redis_1 = require("./init.redis");
const gredisClient = init_redis_1.redisClient.generic;
const setAccountData = async (googleId, prefix, data, EXP = 300) => {
    try {
        const cacheKey = prefix + googleId;
        await gredisClient.set(cacheKey, JSON.stringify(data), "EX", EXP);
        return true;
    }
    catch {
        return false;
    }
};
exports.setAccountData = setAccountData;
const getAccountData = async (prefix, googleId) => {
    const cacheKey = prefix + googleId;
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
exports.getAccountData = getAccountData;
const deleteAccountData = async (key) => {
    await gredisClient.del(key);
};
exports.deleteAccountData = deleteAccountData;
