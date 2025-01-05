"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const misc_1 = __importDefault(require("../helpers/misc"));
const socketMessangers = {
    sendPersonalWebscoketMessage: ((channelType, accountId, data) => {
        try {
            if (channelType && data) {
                const socket = misc_1.default.userConnections.get([channelType, accountId].join('-'));
                if (socket) {
                    const message = JSON.stringify({ type: channelType, data: data });
                    socket.send(message);
                }
                else {
                    console.log("User Websocket connection not found");
                }
            }
        }
        catch (error) {
            throw error;
        }
    })
};
exports.default = socketMessangers;
