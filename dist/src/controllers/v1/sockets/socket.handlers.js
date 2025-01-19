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
exports.closeConnection = exports.joinRoom = void 0;
const socketsStore_service_1 = require("../../../services/v1/sockets/socketsStore.service");
const joinRoom = (socket) => {
    try {
        socket.on("joinRoom", (data) => __awaiter(void 0, void 0, void 0, function* () {
            console.log("Join room Data ", data);
            const { room, token } = data;
            // const chatRoomAuth = await RtmRoomService.joinChatRoomAuth({
            //   token: token,
            //   uid: socket.user?._id?.toString() || socket.user,
            //   room,
            // });
            // console.log("chatRoomAuth ", chatRoomAuth, socket.user?._id?.toString() || socket.user)
            // if (chatRoomAuth?.status) {
            //   socket.join(room);
            //   console.log(`${socket.user?.userName || socket.user} joined room: ${room}`);
            //   socket
            //     .to(room)
            //     .emit("message", `${socket.user?.userName || socket.user} has joined the room`);
            // } else {
            //   socket.emit(
            //     "joinError",
            //     "You are not permitted to join this conversation"
            //   );
            // }
        }));
    }
    catch (error) {
        console.log("JOIN room Error ", error);
    }
};
exports.joinRoom = joinRoom;
const closeConnection = (socket) => {
    socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
        if (socket.user) {
            yield (0, socketsStore_service_1.updateSocketsMap)(socket.user, false, socket);
        }
    }));
};
exports.closeConnection = closeConnection;
