"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cache = void 0;
class Cache {
    constructor() {
        this.cache = {};
    }
    set(key, value, expirationTime) {
        this.cache[key] = {
            value: value,
            expirationTime: Date.now() + expirationTime * 1000 // Convert seconds to milliseconds
        };
        setTimeout(() => {
            this.delete(key);
        }, expirationTime * 1000);
    }
    get(key) {
        const item = this.cache[key];
        if (item && item.expirationTime > Date.now()) {
            return item.value;
        }
        else {
            this.delete(key);
            return null;
        }
    }
    delete(key) {
        delete this.cache[key];
    }
}
exports.Cache = Cache;
