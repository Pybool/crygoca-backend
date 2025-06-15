
import { transferERC20Token } from "./erc-transfers";
import { transferNativeETHEREUM } from "./eth-native-transfers";


export async function transferERC20(
  checkOutId: string,
  tokenAddress: string,
  recipient: string,
  amount: string,
  decimals: number,
  privateKey: string
) {
  try {
    const transferHash = await transferERC20Token(
      privateKey,
      tokenAddress,
      recipient,
      amount
    );
    console.log("[Transfer Response] ", transferHash);
    return transferHash;
  } catch (error) {
    throw error;
  }
}

export async function transferNativeETH(
  recipient: string,
  amount: string,
  privateKey: any
) {
  const txHash = await transferNativeETHEREUM(recipient, amount, privateKey);
  return txHash;
}
