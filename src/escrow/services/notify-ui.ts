import {
  JsonRpcNotification,
  JsonRpcSubscriptionResult,
  JsonRpcSubscriptionResultOld,
  Log,
} from "web3";
import { getUserProfileSockets } from "../../services/v1/sockets/socketsStore.service";

export const sendActiveListenerNotification = async (
  userId: string,
  data: {
    normalizedAddress: string;
    subscriptionData:
      | JsonRpcSubscriptionResult
      | JsonRpcSubscriptionResultOld<Log>
      | JsonRpcNotification<Log>;
  }
) => {
  try {
    const socket: any = getUserProfileSockets(userId);
    if (socket) {
      console.log(`Socket for user ${userId} found`);
      return socket.emit("active-listener-started", JSON.stringify(data));
    }
    console.log(`Failed to get Socket for user ${userId}`);
  } catch (error) {
    console.log(error);
  }
};

export const sendDeadListenerNotification = async (
  userId: string,
  normalizedAddress: string
) => {
  try {
    const socket: any = getUserProfileSockets(userId);
    if (socket) {
      console.log(`Socket for user ${userId} found`);
      return socket.emit(
        "active-listener-dead",
        JSON.stringify({ userId, normalizedAddress })
      );
    }
    console.log(`Failed to get Socket for user ${userId}`);
  } catch (error) {
    console.log(error);
  }
};

export const sendTransferNotification = async (userId: string, intent: any) => {
  try {
    const socket: any = getUserProfileSockets(userId);
    if (socket) {
      console.log(`Socket for user ${userId} found`);
      return socket.emit("crypto-payment-confirmed", JSON.stringify(intent));
    }
    console.log(`Failed to get Socket for user ${userId}`);
  } catch (error) {
    console.log(error);
  }
};

export const sendLockedOrderNotification = async (
  userId: string,
  payload: any
) => {
  try {
    const socket: any = getUserProfileSockets(userId);
    if (socket) {
      console.log(`Socket for user ${userId} found`);
      return socket.emit("crypto-order-locked", JSON.stringify(payload));
    }
    console.log(`Failed to get Socket for user ${userId}`);
  } catch (error) {
    console.log(error);
  }
};

export const sendReleaseLockedFundsNotification = async (
  userId: string,
  payload: any
) => {
  try {
    const socket: any = getUserProfileSockets(userId);
    if (socket) {
      console.log(`Socket for user ${userId} found`);
      return socket.emit("crypto-order-released", JSON.stringify(payload));
    }
    console.log(`Failed to get Socket for user ${userId}`);
  } catch (error) {
    console.log(error);
  }
};

export const sendTopUpNotification = async (userId: string, payload: any) => {
  try {
    const socket: any = getUserProfileSockets(userId);
    if (socket) {
      console.log(`Socket for user ${userId} found`);
      return socket.emit("crypto-top-up", JSON.stringify(payload));
    }
    console.log(`Failed to get Socket for user ${userId}`);
  } catch (error) {
    console.log(error);
  }
};
