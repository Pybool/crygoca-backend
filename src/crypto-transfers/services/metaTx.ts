import BN from "bn.js";
import dotenv from "dotenv";
import metaTransferAbi from "../../../artifacts/contracts/ERC20MetaTransfer.sol/ERC20MetaTransfer.json";
import BlockChainWallets, {
  IChainWallets,
} from "../../models/accounts-chain-wallets";
import web3 from "../../escrow/config/web3";
import { DepositWallets } from "../../services/v1/escrow/depositWallets.service";
import { SupportedChains } from "../../services/v1/escrow/supported-chains";
import mongoose from "mongoose";
import Accounts from "../../models/accounts.model";
import {
  recoverEthSigner,
  recoverSigner,
  signEthMetaTransfer,
  signMetaTransfer,
} from "./metaTx-signer";
import { decryptDataString } from "../../services/v1/helpers";
import { ethers } from "ethers";

dotenv.config();

const depth = Number(process.env.ENC_DEPTH! || '1');

const META_TX_CONTRACT_ADDRESS = process.env.META_TX_CONTRACT_ADDRESS!;
let relayer: any = null;
let metaTransfer: any;

let ethChainId = 11155111; //sepolia testnet

if(process.env.NODE_ENV=='prod'){
  ethChainId = 1;
}

export async function setUpRelayer(){
  let relayerWallet: IChainWallets | null = await BlockChainWallets.findOne({
    chainId: SupportedChains.ETHEREUM,
    isRelayer: true,
  });

  let crygocaPlatform = await Accounts.findOne({ isPlatform: true });
  if (!crygocaPlatform) {
    throw new Error("[Relayer] No relayer account configured")
  }

  if (!relayerWallet || !relayerWallet.privateKey) {
    const session = await mongoose.startSession();
    relayerWallet = (await DepositWallets.createWallet(
      crygocaPlatform._id,
      SupportedChains.ETHEREUM,
      session,
      true
    ))! as IChainWallets;
  }

  return relayerWallet;
}

export async function initMetaRelayer() {
  if (relayer) {
    return relayer;
  }
  
  let relayerWallet: IChainWallets | null = await BlockChainWallets.findOne({
    chainId: SupportedChains.ETHEREUM,
    isRelayer: true,
  });

  let crygocaPlatform = await Accounts.findOne({ isPlatform: true });
  // if (!crygocaPlatform) {
  //   crygocaPlatform = await Accounts.create({
  //     email: "relayaccount@crygoca.com",
  //     firstname: "relaycrygoca",
  //     username: "relaycrygoca",
  //     password: "@1011101errtyyuyuiy1qweQWE",
  //     isPlatform: true,
  //   });
  // }

  if (!relayerWallet || !relayerWallet.privateKey) {
    const session = await mongoose.startSession();
    relayerWallet = (await DepositWallets.createWallet(
      crygocaPlatform._id,
      SupportedChains.ETHEREUM,
      session,
      true
    ))! as IChainWallets;
  }

  if (!relayerWallet) {
    throw new Error("[Relayer] No relayer wallet configured in DB.");
  }

  const PRIVATE_KEY_RELAY = decryptDataString(relayerWallet!.privateKey, depth);
  relayer = web3.eth.accounts.privateKeyToAccount(PRIVATE_KEY_RELAY);
  web3.eth.accounts.wallet.add(relayer);
  metaTransfer = new web3.eth.Contract(
    metaTransferAbi.abi as any,
    META_TX_CONTRACT_ADDRESS
  );

  return relayer;
}

/**
 * Creates a signed meta-transaction payload
 */

export async function createSignedTransfer({
  tokenAddress,
  fromPrivateKey,
  to,
  amount,
  deadline,
}: {
  tokenAddress: string;
  fromPrivateKey: string;
  to: string;
  amount: string;
  deadline: number; // Unix timestamp
}) {
  const fromAccount = web3.eth.accounts.privateKeyToAccount(fromPrivateKey);
  const from = fromAccount.address;

  const nonce = await getNonce(from);
  const signer = new ethers.Wallet(fromPrivateKey);
  if (tokenAddress !== "native_eth") {
    const { v, r, s } = await signMetaTransfer({
      signer,
      token: tokenAddress,
      from,
      to,
      amount,
      nonce,
      deadline,
      chainId: ethChainId,
      verifyingContract: META_TX_CONTRACT_ADDRESS, // The deployed address of ERC20MetaTransfer
    });

    const recoveredAddress = recoverSigner({
      v,
      r,
      s,
      token: tokenAddress,
      from,
      to,
      amount,
      nonce,
      deadline,
      chainId: ethChainId, // example: Sepolia
      verifyingContract: META_TX_CONTRACT_ADDRESS, // ERC20MetaTransfer contract address
    });

    return {
      from,
      to,
      amount,
      token: tokenAddress,
      nonce,
      deadline,
      v,
      r,
      s,
    };
  } else {
    const { v, r, s } = await signEthMetaTransfer({
      signer,
      from,
      to,
      amount,
      nonce,
      deadline,
      chainId: ethChainId,
      verifyingContract: META_TX_CONTRACT_ADDRESS, // The deployed address of ERC20MetaTransfer
    });

    const recoveredAddress = recoverEthSigner({
      v,
      r,
      s,
      from,
      to,
      amount,
      nonce,
      deadline,
      chainId: ethChainId, // example: Sepolia
      verifyingContract: META_TX_CONTRACT_ADDRESS, // ERC20MetaTransfer contract address
    });

    return {
      from,
      to,
      amount,
      nonce,
      deadline,
      v,
      r,
      s,
    };
  }
}

/**
 * Relays a meta-transaction using relayer account
 */
export async function relayTransfer(
  metaTx: {
    token?: string;
    from: string;
    to: string;
    amount: string;
    deadline: number;
    v: number;
    r: string;
    s: string;
    nonce: number;
  },
  isEth: boolean = false
) {
  if (!relayer || !metaTransfer) {
    throw new Error("[Relayer] Not initialized. Call initMetaRelayer() first.");
  }

  const gasPrice = await web3.eth.getGasPrice();

  const method = isEth
    ? metaTransfer.methods.metaTransferETH(
        metaTx.from.toLowerCase(),
        metaTx.to.toLowerCase(),
        metaTx.amount,
        metaTx.deadline,
        metaTx.v,
        metaTx.r,
        metaTx.s
      )
    : metaTransfer.methods.metaTransferERC20(
        metaTx.token,
        metaTx.from,
        metaTx.to,
        metaTx.amount,
        metaTx.deadline,
        metaTx.v,
        metaTx.r,
        metaTx.s
      );

  // Dynamically estimate gas to avoid hardcoding
  let estimatedGas = new BN(
    await method.estimateGas({ from: relayer.address })
  );
  // Add 10000 as BN
  estimatedGas = estimatedGas.add(new BN(10000));

  const receipt = await method
    .send({
      from: relayer.address,
      gas: estimatedGas.toString(),
      gasPrice,
    })
    .on("transactionHash", (hash: string) => {
      console.log(
        isEth ? "[Relay Native ETH]" : "[Relay ERC Token]",
        "Transaction sent:",
        hash
      );
    });

  await incrementNonce(metaTx.from);
  return receipt;
}

/**
 * Gets stored nonce from MongoDB
 */
export async function getNonce(address: string): Promise<number> {
  const lower = address.toLowerCase();
  let doc = await BlockChainWallets.findOne({ address: lower });
  return doc?.nonce || 0;
}

/**
 * Increments stored nonce in MongoDB
 */
export async function incrementNonce(address: string): Promise<void> {
  const lower = address.toLowerCase();
  await BlockChainWallets.findOneAndUpdate(
    { address: lower },
    { $inc: { nonce: 1 } },
    { upsert: true }
  );
}
