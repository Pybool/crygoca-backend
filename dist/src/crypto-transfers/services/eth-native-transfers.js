"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferNativeETHEREUM = void 0;
const web3_1 = __importDefault(require("../../escrow/config/web3"));
const supported_chains_1 = require("../../services/v1/escrow/supported-chains");
const useRelayer = false;
// const META_TX_CONTRACT_ADDRESS = process.env.META_TX_CONTRACT_ADDRESS!;
/**
 * Transfers native ETH either directly or using a relayer.
 */
async function transferNativeETHEREUM(recipient, amountETH, privateKey) {
    try {
        const account = web3_1.default.eth.accounts.privateKeyToAccount(privateKey);
        web3_1.default.eth.accounts.wallet.add(account);
        // 🔐 Direct ETH transfer
        const senderBalanceBefore = await web3_1.default.eth.getBalance(account.address);
        const recipientBalanceBefore = await web3_1.default.eth.getBalance(recipient);
        const gasPrice = await web3_1.default.eth.getGasPrice(); // gasPrice is bigint
        const gasLimit = 21000;
        // Calculate gas fee in wei (as bigint)
        const gasFee = gasPrice * BigInt(gasLimit);
        // Convert rawAmount to bigint
        const rawAmountBigInt = BigInt(web3_1.default.utils.toWei(amountETH, "ether"));
        // Deduct gas fee
        const finalAmount = rawAmountBigInt - gasFee;
        // Check if finalAmount is negative
        if (finalAmount < 0n) {
            throw new Error("Insufficient rawAmount to cover gas fee");
        }
        const tx = {
            from: account.address,
            to: recipient,
            value: finalAmount.toString(),
            gas: gasLimit,
            gasPrice: gasPrice.toString(), // ensure it’s string for web3
            chainId: supported_chains_1.SupportedChains.ETHEREUM,
        };
        const signedTx = await web3_1.default.eth.accounts.signTransaction(tx, privateKey);
        const receipt = await web3_1.default.eth.sendSignedTransaction(signedTx.rawTransaction);
        if (!receipt?.transactionHash)
            return null;
        console.log(`✅ ETH transfer success! Tx hash:`, receipt.transactionHash);
        const senderBalanceAfter = await web3_1.default.eth.getBalance(account.address);
        const recipientBalanceAfter = await web3_1.default.eth.getBalance(recipient);
        console.log(`📦 ETH balance after transfer`);
        console.log(`   Sender:   ${web3_1.default.utils.fromWei(senderBalanceAfter.toString(), "ether")}`);
        console.log(`   Recipient: ${web3_1.default.utils.fromWei(recipientBalanceAfter.toString(), "ether")}`);
        return receipt.transactionHash.toString();
    }
    catch (error) {
        console.error("❌ ETH transfer failed:", error);
        throw error;
    }
}
exports.transferNativeETHEREUM = transferNativeETHEREUM;
