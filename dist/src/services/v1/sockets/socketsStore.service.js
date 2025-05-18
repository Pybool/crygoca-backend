"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllAdminProfileSockets = exports.getUserProfileSockets = exports.updateSocketsMap = void 0;
const connectedSocketsMap = new Map();
const updateSocketsMap = (user, connected, socket) => {
    if (!user._id && !user) {
        return null;
    }
    if (connected) {
        connectedSocketsMap.set(user?._id?.toString() || user, socket);
    }
    else {
        connectedSocketsMap.delete(user?._id?.toString() || user);
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
