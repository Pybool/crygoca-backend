import { getUserProfileSockets } from "../../services/v1/sockets/socketsStore.service";

export const sendTransferNotification = async (userId: string, intent:any)=>{
    try {
      const socket: any = getUserProfileSockets(userId);
      if (socket) {
        console.log(`Socket for user ${userId} found`);
        socket.emit("crypto-payment-confirmed", JSON.stringify(intent));
      }
    } catch (error) {
      console.log(error);
    }
}

export const sendLockedOrderNotification = async (userId: string, payload:any)=>{
  try {
    const socket: any = getUserProfileSockets(userId);
    if (socket) {
      console.log(`Socket for user ${userId} found`);
      socket.emit("crypto-order-locked", JSON.stringify(payload));
    }
  } catch (error) {
    console.log(error);
  }
}