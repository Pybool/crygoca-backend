"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeConnection = exports.joinRoom = void 0;
const socketsStore_service_1 = require("../../../services/v1/sockets/socketsStore.service");
const joinRoom = (socket) => {
    try {
        socket.on("joinRoom", async (data) => {
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
