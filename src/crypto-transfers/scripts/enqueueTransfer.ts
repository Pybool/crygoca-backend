import { IChainWallets } from "../../models/accounts-chain-wallets";
import { transferQueue } from "../bullmq/queues";

export interface IEthTransfer {
  userId: string;
  escrowId:string;
  recipient: string;
  checkOutId:string;
  type: "native";
  symbol: "ETH";
  amount: string;
  blockchainWallet?: IChainWallets
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
  blockchainWallet?: IChainWallets
}

export async function EthereumNetworkTransfer(
  type: "native",
  transferPayload: IEthTransfer
) {
  await transferQueue.add(type, transferPayload);
}

export async function ERC20Transfer(
  type: "erc20",
  transferPayload: IErc20Transfer
) {
  await transferQueue.add(type, transferPayload);
}