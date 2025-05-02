"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateKeys = void 0;
const crypto_1 = require("crypto");
function generateKeys(type, mode) {
    const prefix = type === "public"
        ? `CRY-PUB-${mode.toUpperCase()}-`
        : `CRY-SEC-${mode.toUpperCase()}-`;
    const randomPart = (0, crypto_1.randomBytes)(16).toString("hex").toUpperCase(); // 32 chars
    return prefix + randomPart;
}
exports.generateKeys = generateKeys;
