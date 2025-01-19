import { CustomSocket } from "../../../middlewares/socketAuth";
import { updateSocketsMap } from "../../../services/v1/sockets/socketsStore.service";

export const joinRoom = (socket: CustomSocket) => {
  try {
    socket.on("joinRoom", async (data: { room: any; token: any }) => {
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
  } catch (error) {
    console.log("JOIN room Error ", error);
  }
};

export const closeConnection = (socket: CustomSocket) => {
  socket.on("disconnect", async () => {
    if (socket.user) {
      await updateSocketsMap(socket.user, false, socket);
    }
  });
};
