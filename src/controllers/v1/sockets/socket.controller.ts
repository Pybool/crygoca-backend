import { Server } from "socket.io";
import { closeConnection, joinRoom } from "./socket.handlers";
import { CustomSocket } from "../../../middlewares/socketAuth";
import { updateSocketsMap } from "../../../services/v1/sockets/socketsStore.service";

export const setupSocketHandlers = (io: Server) => {
  try {
    io.on("connection", async (socket: CustomSocket) => {
      socket.emit("connection", "Connected to CRYGOCA Messaging Socket");
      if (socket.user) {
        await updateSocketsMap(socket.user, true, socket);
      }
      joinRoom(socket);
      closeConnection(socket);
    });

    io.on("message", (message: any) => {
      console.log("Message ", message);
    });
  } catch (error) {
    console.log("Socket handler error ", error);
  }
};
