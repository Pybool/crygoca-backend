import BN from "bn.js";
import web3 from "../../escrow/config/web3";
import { createSignedTransfer, relayTransfer } from "./metaTx";
import { SupportedChains } from "../../services/v1/escrow/supported-chains";

const useRelayer = false;
// const META_TX_CONTRACT_ADDRESS = process.env.META_TX_CONTRACT_ADDRESS!;

/**
 * Transfers native ETH either directly or using a relayer.
 */
export async function transferNativeETHEREUM(
  recipient: string,
  amountETH: string,
  privateKey: string
) {
  try {
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);

    // 🔐 Direct ETH transfer
    const senderBalanceBefore = await web3.eth.getBalance(account.address);
    const recipientBalanceBefore = await web3.eth.getBalance(recipient);

    console.log(`🔎 ETH balance before transfer`);
    console.log(
      `   Sender:   ${web3.utils.fromWei(
        senderBalanceBefore.toString(),
        "ether"
      )}`
    );
    console.log(
      `   Recipient: ${web3.utils.fromWei(
        recipientBalanceBefore.toString(),
        "ether"
      )}`
    );

    const gasPrice = await web3.eth.getGasPrice(); // gasPrice is bigint
    const gasLimit = 21000;

    // Calculate gas fee in wei (as bigint)
    const gasFee = gasPrice * BigInt(gasLimit);

    // Convert rawAmount to bigint
    const rawAmountBigInt = BigInt(web3.utils.toWei(amountETH, "ether"));

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
      chainId: SupportedChains.ETHEREUM,
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey);

    const receipt = await web3.eth.sendSignedTransaction(
      signedTx.rawTransaction!
    );
    if (!receipt?.transactionHash) return null;

    console.log(`✅ ETH transfer success! Tx hash:`, receipt.transactionHash);

    const senderBalanceAfter = await web3.eth.getBalance(account.address);
    const recipientBalanceAfter = await web3.eth.getBalance(recipient);

    console.log(`📦 ETH balance after transfer`);
    console.log(
      `   Sender:   ${web3.utils.fromWei(
        senderBalanceAfter.toString(),
        "ether"
      )}`
    );
    console.log(
      `   Recipient: ${web3.utils.fromWei(
        recipientBalanceAfter.toString(),
        "ether"
      )}`
    );

    return receipt.transactionHash.toString();
  } catch (error: any) {
    console.error("❌ ETH transfer failed:", error);
    throw error;
  }
}
