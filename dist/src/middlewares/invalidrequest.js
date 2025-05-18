"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleInvalidMethod = void 0;
const handleInvalidMethod = (req, res, next) => {
    res.status(405).json({ error: 'Method Not Allowed' });
};
exports.handleInvalidMethod = handleInvalidMethod;
