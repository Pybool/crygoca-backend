import { Wallet as EvmWallet } from "ethers";
import { Keypair } from "@solana/web3.js";
import { ClientSession } from "mongoose";
import BlockChainWallets, {
  IChainWallets,
} from "../../../models/accounts-chain-wallets";
import { SupportedChains } from "./supported-chains";
import { encryptDataString } from "../helpers";

const depth = Number(process.env.ENC_DEPTH! || '1');

export class DepositWallets {
  private static chainHandlers: Record<
    number,
    () => { address: string; privateKey: string }
  > = {
    [SupportedChains.ETHEREUM]: DepositWallets.createEVMBasedWallet,
    [SupportedChains.BSC]: DepositWallets.createEVMBasedWallet,
    [SupportedChains.POLYGON]: DepositWallets.createEVMBasedWallet,
    [SupportedChains.SOLANA]: DepositWallets.createSolanaWallet,
    [SupportedChains.TRON]: DepositWallets.createTronWallet,
  };

  static createEVMBasedWallet(): { address: string; privateKey: string } {
    const wallet = EvmWallet.createRandom();
    return {
      address: wallet.address.toLowerCase(),
      privateKey: wallet.privateKey,
    };
  }

  static createSolanaWallet(): { address: string; privateKey: string } {
    const keypair = Keypair.generate();
    return {
      address: keypair.publicKey.toBase58().toString().toLowerCase(),
      privateKey: Buffer.from(keypair.secretKey).toString("hex"),
    };
  }

  static createTronWallet() {
    const wallet = {
        address: "",
        privateKey: ""
    }
    return {
      address: wallet.address.toLowerCase(),
      privateKey: wallet.privateKey,
    };
  }

  static async createWallet(
    account: string,
    chainId: number,
    session: ClientSession,
    isRelayer: boolean = false
  ) {
    const existing = await BlockChainWallets.findOne({ account, chainId });
    if (existing) return existing;

    const handler = this.chainHandlers[chainId];
    if (!handler) {
      throw new Error(`Unsupported chainId: ${chainId}`);
    }

    const { address, privateKey } = handler();
    const encryptedPrivateKey = encryptDataString(privateKey, depth);

    const walletInfo = (
      await BlockChainWallets.create(
        [
          {
            account,
            chainId,
            address,
            privateKey: encryptedPrivateKey,
            isRelayer
          },
        ],
        { session }
      )
    )[0] as IChainWallets;

    return walletInfo;
  }
}
