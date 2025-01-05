"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const CORS_OPTIONS = {
    origin: (origin, callback) => {
        const ALLOWED_CORS_ORIGINS = "localhost,127.0.0.1,http://localhost:4200,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001";
        const allowedOrigins = ALLOWED_CORS_ORIGINS.split(",");
        if (!origin || !allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            // logger.info("Not allowed by CORS")
            callback(null, true);
            // callback(new Error("Not allowed by CORS"));
        }
    },
};
exports.default = (0, cors_1.default)(CORS_OPTIONS);
