"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionMiddleware = void 0;
const express_session_1 = __importDefault(require("express-session"));
const _app_1 = __importDefault(require("../bootstrap/_app"));
exports.sessionMiddleware = (0, express_session_1.default)({
    secret: 'your-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set `secure: true` if using HTTPS
});
// Use this session middleware in Express
_app_1.default.use(exports.sessionMiddleware);
