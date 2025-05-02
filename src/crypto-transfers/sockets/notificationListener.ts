import { Worker, Job } from "bullmq";
import { getUserProfileSockets } from "../../services/v1/sockets/socketsStore.service";

// BullMQ Worker to listen for notifications
interface NotifyData {
  userId: string;
  recipient: string;
  symbol: string;
  amount: string;
  txHash?: string;
  status: "success" | "failed";
  error?: string;
}

export const startEscrowPayoutNotificationListener = () => {
  new Worker(
    "notification-queue",
    async (job: Job<NotifyData>) => {
      try {
        const { userId, recipient, symbol, amount, txHash, status, error } =
          job.data;

        const payload = {
          recipient,
          symbol,
          amount,
          txHash,
          status,
          error,
        };
        const socket: any = getUserProfileSockets(userId);
        if (socket) {
          console.log(`Socket for user ${userId} found`);
          console.log(`📣 Emitting notification for ${recipient}`);
          socket.emit("crypto-purchase-sent", JSON.stringify(payload));
        }
      } catch (error) {
        console.log(error);
      }
    },
    {
      connection: {
        host: "127.0.0.1",
        port: 6379,
      },
    }
  );
};
