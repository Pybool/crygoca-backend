"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAdminProfileSockets = exports.getUserProfileSockets = exports.updateSocketsMap = void 0;
const connectedSocketsMap = new Map();
const updateSocketsMap = (user, connected, socket) => {
    var _a, _b;
    if (!user._id && !user) {
        return null;
    }
    if (connected) {
        connectedSocketsMap.set(((_a = user === null || user === void 0 ? void 0 : user._id) === null || _a === void 0 ? void 0 : _a.toString()) || user, socket);
    }
    else {
        connectedSocketsMap.delete(((_b = user === null || user === void 0 ? void 0 : user._id) === null || _b === void 0 ? void 0 : _b.toString()) || user);
    }
    return true;
};
exports.updateSocketsMap = updateSocketsMap;
const getUserProfileSockets = (userId) => {
    return connectedSocketsMap.get(userId);
};
exports.getUserProfileSockets = getUserProfileSockets;
const getAllAdminProfileSockets = () => {
    return Array.from(connectedSocketsMap.values());
};
exports.getAllAdminProfileSockets = getAllAdminProfileSockets;
