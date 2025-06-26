"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeConnection = exports.joinRoom = void 0;
const socketsStore_service_1 = require("../../../services/v1/sockets/socketsStore.service");
const joinRoom = (socket) => {
    try {
        socket.on("joinRoom", async (data) => {
        });
    }
    catch (error) {
        console.log("JOIN room Error ", error);
    }
};
exports.joinRoom = joinRoom;
const closeConnection = (socket) => {
    socket.on("disconnect", async () => {
        if (socket.user) {
            await (0, socketsStore_service_1.updateSocketsMap)(socket.user, false, socket);
        }
    });
};
exports.closeConnection = closeConnection;
