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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccountData = exports.getAccountData = exports.setAccountData = void 0;
const init_redis_1 = require("./init.redis");
const gredisClient = init_redis_1.redisClient.generic;
const setAccountData = (googleId_1, prefix_1, data_1, ...args_1) => __awaiter(void 0, [googleId_1, prefix_1, data_1, ...args_1], void 0, function* (googleId, prefix, data, EXP = 300) {
    try {
        const cacheKey = prefix + googleId;
        yield gredisClient.set(cacheKey, JSON.stringify(data), "EX", EXP);
        return true;
    }
    catch (_a) {
        return false;
    }
});
exports.setAccountData = setAccountData;
const getAccountData = (prefix, googleId) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheKey = prefix + googleId;
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
exports.getAccountData = getAccountData;
const deleteAccountData = (key) => __awaiter(void 0, void 0, void 0, function* () {
    yield gredisClient.del(key);
});
exports.deleteAccountData = deleteAccountData;
