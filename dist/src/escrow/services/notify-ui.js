"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendLockedOrderNotification = exports.sendTransferNotification = void 0;
const socketsStore_service_1 = require("../../services/v1/sockets/socketsStore.service");
const sendTransferNotification = (userId, intent) => __awaiter(void 0, void 0, void 0, function* () {
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
});
exports.sendTransferNotification = sendTransferNotification;
const sendLockedOrderNotification = (userId, payload) => __awaiter(void 0, void 0, void 0, function* () {
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
});
exports.sendLockedOrderNotification = sendLockedOrderNotification;
