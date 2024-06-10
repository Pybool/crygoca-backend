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
exports.fetchCrypto = void 0;
const axios_1 = __importDefault(require("axios"));
const cache_1 = require("../../middlewares/cache");
const mockcrypto_response_1 = require("./mockcrypto.response");
const memCache = new cache_1.Cache();
const fetchCrypto = (url_1, ...args_1) => __awaiter(void 0, [url_1, ...args_1], void 0, function* (url, isTask = false) {
    return new Promise((resolve, reject) => {
        if (memCache.get("crypto-currencies") && !isTask) {
            console.log(memCache.get("crypto-currencies"), typeof memCache.get("crypto-currencies"));
            resolve(memCache.get("crypto-currencies"));
        }
        else {
            memCache.set("crypto-currencies", mockcrypto_response_1.response, 120);
            resolve(mockcrypto_response_1.response);
            axios_1.default
                .get(url)
                .then((_response) => {
                memCache.set("crypto-currencies", _response.data, 120);
                resolve(_response.data);
            })
                .catch((error) => {
                resolve({
                    status: false,
                    data: null,
                    error: error,
                });
            });
        }
    });
});
exports.fetchCrypto = fetchCrypto;
