"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.limiter = void 0;
const express_rate_limit_1 = require("express-rate-limit");
exports.limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 300, // limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
});
