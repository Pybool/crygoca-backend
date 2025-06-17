"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepositWallets = void 0;
const ethers_1 = require("ethers");
const accounts_chain_wallets_1 = __importDefault(require("../../../models/accounts-chain-wallets"));
const supported_chains_1 = require("./supported-chains");
const helpers_1 = require("../helpers");
const depth = Number(process.env.ENC_DEPTH || '1');
class DepositWallets {
    static createEVMBasedWallet() {
        const wallet = ethers_1.Wallet.createRandom();
        return {
            address: wallet.address.toLowerCase(),
            privateKey: wallet.privateKey,
        };
    }
    static createSolanaWallet() {
        // const keypair = Keypair.generate();
        // return {
        //   address: keypair.publicKey.toBase58().toString().toLowerCase(),
        //   privateKey: Buffer.from(keypair.secretKey).toString("hex"),
        // };
        return {
            address: "",
            privateKey: ""
        };
    }
    static createTronWallet() {
        const wallet = {
            address: "",
            privateKey: ""
        };
        return {
            address: wallet.address.toLowerCase(),
            privateKey: wallet.privateKey,
        };
    }
    static async createWallet(account, chainId, session, isRelayer = false) {
        const existing = await accounts_chain_wallets_1.default.findOne({ account, chainId });
        if (existing)
            return existing;
        const handler = this.chainHandlers[chainId];
        if (!handler) {
            throw new Error(`Unsupported chainId: ${chainId}`);
        }
        const { address, privateKey } = handler();
        const encryptedPrivateKey = (0, helpers_1.encryptDataString)(privateKey, depth);
        const walletInfo = (await accounts_chain_wallets_1.default.create([
            {
                account,
                chainId,
                address,
                privateKey: encryptedPrivateKey,
                isRelayer
            },
        ], { session }))[0];
        return walletInfo;
    }
}
exports.DepositWallets = DepositWallets;
DepositWallets.chainHandlers = {
    [supported_chains_1.SupportedChains.ETHEREUM]: DepositWallets.createEVMBasedWallet,
    [supported_chains_1.SupportedChains.BSC]: DepositWallets.createEVMBasedWallet,
    [supported_chains_1.SupportedChains.POLYGON]: DepositWallets.createEVMBasedWallet,
    [supported_chains_1.SupportedChains.SOLANA]: DepositWallets.createSolanaWallet,
    [supported_chains_1.SupportedChains.TRON]: DepositWallets.createTronWallet,
};
