"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTopUpNotification = exports.sendReleaseLockedFundsNotification = exports.sendLockedOrderNotification = exports.sendTransferNotification = exports.sendDeadListenerNotification = exports.sendActiveListenerNotification = void 0;
const socketsStore_service_1 = require("../../services/v1/sockets/socketsStore.service");
const sendActiveListenerNotification = async (userId, data) => {
    try {
        const socket = (0, socketsStore_service_1.getUserProfileSockets)(userId);
        if (socket) {
            console.log(`Socket for user ${userId} found`);
            return socket.emit("active-listener-started", JSON.stringify(data));
        }
        console.log(`Failed to get Socket for user ${userId}`);
    }
    catch (error) {
        console.log(error);
    }
};
exports.sendActiveListenerNotification = sendActiveListenerNotification;
const sendDeadListenerNotification = async (userId, normalizedAddress) => {
    try {
        const socket = (0, socketsStore_service_1.getUserProfileSockets)(userId);
        if (socket) {
            console.log(`Socket for user ${userId} found`);
            return socket.emit("active-listener-dead", JSON.stringify({ userId, normalizedAddress }));
        }
        console.log(`Failed to get Socket for user ${userId}`);
    }
    catch (error) {
        console.log(error);
    }
};
exports.sendDeadListenerNotification = sendDeadListenerNotification;
const sendTransferNotification = async (userId, intent) => {
    try {
        const socket = (0, socketsStore_service_1.getUserProfileSockets)(userId);
        if (socket) {
            console.log(`Socket for user ${userId} found`);
            return socket.emit("crypto-payment-confirmed", JSON.stringify(intent));
        }
        console.log(`Failed to get Socket for user ${userId}`);
    }
    catch (error) {
        console.log(error);
    }
};
exports.sendTransferNotification = sendTransferNotification;
const sendLockedOrderNotification = async (userId, payload) => {
    try {
        const socket = (0, socketsStore_service_1.getUserProfileSockets)(userId);
        if (socket) {
            console.log(`Socket for user ${userId} found`);
            return socket.emit("crypto-order-locked", JSON.stringify(payload));
        }
        console.log(`Failed to get Socket for user ${userId}`);
    }
    catch (error) {
        console.log(error);
    }
};
exports.sendLockedOrderNotification = sendLockedOrderNotification;
const sendReleaseLockedFundsNotification = async (userId, payload) => {
    try {
        const socket = (0, socketsStore_service_1.getUserProfileSockets)(userId);
        if (socket) {
            console.log(`Socket for user ${userId} found`);
            return socket.emit("crypto-order-released", JSON.stringify(payload));
        }
        console.log(`Failed to get Socket for user ${userId}`);
    }
    catch (error) {
        console.log(error);
    }
};
exports.sendReleaseLockedFundsNotification = sendReleaseLockedFundsNotification;
const sendTopUpNotification = async (userId, payload) => {
    try {
        const socket = (0, socketsStore_service_1.getUserProfileSockets)(userId);
        if (socket) {
            console.log(`Socket for user ${userId} found`);
            return socket.emit("crypto-top-up", JSON.stringify(payload));
        }
        console.log(`Failed to get Socket for user ${userId}`);
    }
    catch (error) {
        console.log(error);
    }
};
exports.sendTopUpNotification = sendTopUpNotification;
