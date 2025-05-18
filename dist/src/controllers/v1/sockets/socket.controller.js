"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = void 0;
const socket_handlers_1 = require("./socket.handlers");
const socketsStore_service_1 = require("../../../services/v1/sockets/socketsStore.service");
const setupSocketHandlers = (io) => {
    try {
        io.on("connection", async (socket) => {
            socket.emit("connection", "Connected to CRYGOCA Messaging Socket");
            if (socket.user) {
                await (0, socketsStore_service_1.updateSocketsMap)(socket.user, true, socket);
            }
            (0, socket_handlers_1.joinRoom)(socket);
            (0, socket_handlers_1.closeConnection)(socket);
        });
        io.on("message", (message) => {
            console.log("Message ", message);
        });
    }
    catch (error) {
        console.log("Socket handler error ", error);
    }
};
exports.setupSocketHandlers = setupSocketHandlers;
