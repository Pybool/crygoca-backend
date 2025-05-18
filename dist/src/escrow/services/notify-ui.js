"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTopUpNotification = exports.sendReleaseLockedFundsNotification = exports.sendLockedOrderNotification = exports.sendTransferNotification = void 0;
const socketsStore_service_1 = require("../../services/v1/sockets/socketsStore.service");
const sendTransferNotification = async (userId, intent) => {
    try {
        const socket = (0, socketsStore_service_1.getUserProfileSockets)(userId);
        if (socket) {
            console.log(`Socket for user ${userId} found`);
            socket.emit("crypto-payment-confirmed", JSON.stringify(intent));
        }
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
            socket.emit("crypto-order-locked", JSON.stringify(payload));
        }
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
            socket.emit("crypto-order-released", JSON.stringify(payload));
        }
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
            socket.emit("crypto-top-up", JSON.stringify(payload));
        }
    }
    catch (error) {
        console.log(error);
    }
};
exports.sendTopUpNotification = sendTopUpNotification;
