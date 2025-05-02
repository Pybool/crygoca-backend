import { transferQueue } from "../bullmq/queues";

export interface IEthTransfer {
  userId: string;
  escrowId:string;
  recipient: string;
  type: "native";
  symbol: "ETH";
  amount: string;
}

export interface IErc20Transfer {
  userId: string;
  escrowId:string;
  checkOutId:string;
  recipient: string;
  type: "erc20";
  symbol: string;
  amount: string;
  tokenAddress: string;
  decimals: number;
}

export async function EthereumNetworkTransfer(
  type: string,
  transferPayload: IEthTransfer
) {
  await transferQueue.add(type, transferPayload);
}

export async function ERC20Transfer(
  type: string,
  transferPayload: IErc20Transfer
) {
  await transferQueue.add(type, transferPayload);
}