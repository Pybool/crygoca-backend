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
exports.setupSocketHandlers = void 0;
const socket_handlers_1 = require("./socket.handlers");
const socketsStore_service_1 = require("../../../services/v1/sockets/socketsStore.service");
const setupSocketHandlers = (io) => {
    try {
        io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
            socket.emit("connection", "Connected to CRYGOCA Messaging Socket");
            if (socket.user) {
                yield (0, socketsStore_service_1.updateSocketsMap)(socket.user, true, socket);
            }
            (0, socket_handlers_1.joinRoom)(socket);
            (0, socket_handlers_1.closeConnection)(socket);
        }));
        io.on("message", (message) => {
            console.log("Message ", message);
        });
    }
    catch (error) {
        console.log("Socket handler error ", error);
    }
};
exports.setupSocketHandlers = setupSocketHandlers;
