"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _SecretsManager_instances, _SecretsManager_secrets, _SecretsManager_decryptEnv, _SecretsManager_proxyProcessEnv;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecretsManager = void 0;
// secrets.js
const fs = require("fs");
const MCrypto = require("crypto");
class SecretsManager {
    constructor(password) {
        _SecretsManager_instances.add(this);
        _SecretsManager_secrets.set(this, {});
        __classPrivateFieldSet(this, _SecretsManager_secrets, __classPrivateFieldGet(this, _SecretsManager_instances, "m", _SecretsManager_decryptEnv).call(this, password), "f");
        __classPrivateFieldGet(this, _SecretsManager_instances, "m", _SecretsManager_proxyProcessEnv).call(this);
    }
    get(key) {
        return __classPrivateFieldGet(this, _SecretsManager_secrets, "f")[key];
    }
}
exports.SecretsManager = SecretsManager;
_SecretsManager_secrets = new WeakMap(), _SecretsManager_instances = new WeakSet(), _SecretsManager_decryptEnv = function _SecretsManager_decryptEnv(password) {
    const algorithm = "aes-256-cbc";
    const ivLength = 16;
    const encrypted = fs.readFileSync(".env.enc");
    const iv = encrypted.slice(0, ivLength);
    const encryptedText = encrypted.slice(ivLength);
    const key = MCrypto.createHash("sha256").update(password).digest();
    const decipher = MCrypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, undefined, "utf8");
    decrypted += decipher.final("utf8");
    const envObj = {};
    decrypted.split("\n").forEach((line) => {
        if (!line.trim())
            return;
        const [k, ...v] = line.split("=");
        envObj[k.trim()] = v.join("=").trim();
    });
    return envObj;
}, _SecretsManager_proxyProcessEnv = function _SecretsManager_proxyProcessEnv() {
    const proxy = new Proxy(process.env, {
        get: (target, prop) => {
            const _prop = prop;
            if (typeof _prop === "string" && __classPrivateFieldGet(this, _SecretsManager_secrets, "f")[_prop]) {
                return __classPrivateFieldGet(this, _SecretsManager_secrets, "f")[_prop];
            }
            return target[_prop];
        },
    });
    global.process.env = proxy;
};
// {
//   "_id": {
//     "$oid": "6842ff2d3a280dfe916355ef"
//   },
//   "account": {
//     "$oid": "6842ff2b3a280dfe916355ea"
//   },
//   "chainId": 1,
//   "address": "0x5c32dc04ec965f8fc0253261b018d9f1af4f6b24",
//   "privateKey": "b519f6ffb16e01322b0d830d07fc5c36:2494dfb84e19e8854f9d7fc9ee89b9ab9499d1ef5bcfc579898523154bb2f8cfaa1b243b441514fac6ca6867328cba516948e2310716d67f9233aa57d8968914a5de:f00ac1f2737bf95fe0ba7aff52c7fbe8",
//   "nonce": 0,
//   "isRelayer": false,
//   "createdAt": {
//     "$date": "2025-06-06T14:46:05.377Z"
//   },
//   "updatedAt": {
//     "$date": "2025-06-06T14:46:05.377Z"
//   },
//   "__v": 0
// }
