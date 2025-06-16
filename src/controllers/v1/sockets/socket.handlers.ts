import { CustomSocket } from "../../../middlewares/socketAuth";
import { updateSocketsMap } from "../../../services/v1/sockets/socketsStore.service";

export const joinRoom = (socket: CustomSocket) => {
  try {
    socket.on("joinRoom", async (data: { room: any; token: any }) => {
      console.log("Join room Data ", data);
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
