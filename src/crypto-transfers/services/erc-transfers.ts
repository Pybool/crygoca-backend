import ERC20ABI from "./abis/erc20-abi.json";
import web3 from "../../escrow/config/web3";
import BN from "bn.js";
import { SupportedChains } from "../../services/v1/escrow/supported-chains";
import { convertCryptoToCrypto } from "../../helpers/convert-crypto";
import { createSignedTransfer, initMetaRelayer, relayTransfer } from "./metaTx";
import { Bytes } from "web3";

const useRelayer = process.env.USE_META_TX_RELAYER! === "true";
const META_TX_CONTRACT_ADDRESS = process.env.META_TX_CONTRACT_ADDRESS!;

/**
 * Transfers ERC20 tokens either directly or using a relayer.
 */
export async function transferERC20Token(
  privateKey: string,
  tokenAddress: string,
  recipient: string,
  amountTokens: string // e.g. "10" (human readable)
) {
  try {
    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);
    const tokenContract = new web3.eth.Contract(ERC20ABI, tokenAddress);

    const decimals = Number(await tokenContract.methods.decimals().call());
    const symbol = (await tokenContract.methods.symbol().call()) as string;
    const decimalsBN = new BN(10).pow(new BN(decimals));
    const rawAmount = new BN(amountTokens).mul(decimalsBN);

    if (useRelayer) {
      // 🔁 Use meta-transaction relay logic

      const deadline =
        Math.floor(Date.now() / 1000) +
        60 * parseInt(process.env.META_TRANSFER_DEADLINE!); // 20 minutes
      const metaTx = await createSignedTransfer({
        tokenAddress,
        fromPrivateKey: privateKey,
        to: recipient,
        amount: rawAmount.toString(),
        deadline,
      });
      await approveIfNeeded(
        account,
        tokenContract,
        META_TX_CONTRACT_ADDRESS,
        rawAmount
      );
      console.log("metaTx ", metaTx);
      const receipt = await relayTransfer(metaTx);
      console.log(
        `✅ Relayed transfer success! Tx hash:`,
        receipt.transactionHash
      );
      return receipt.transactionHash;
    } else {
      // 🔐 Direct private key-based transfer
      const senderBalanceBefore = new BN(
        await tokenContract.methods.balanceOf(account.address).call()
      );
      const recipientBalanceBefore = new BN(
        await tokenContract.methods.balanceOf(recipient).call()
      );

      console.log(`🔎 ${symbol} balance before transfer`);
      console.log(
        `   Sender:   ${senderBalanceBefore.div(decimalsBN).toString()}`
      );
      console.log(
        `   Recipient: ${recipientBalanceBefore.div(decimalsBN).toString()}`
      );

      const gasDetails = await calculateGasEstimate(
        amountTokens,
        recipient,
        account.address,
        tokenAddress,
        symbol
      );

      const gas = gasDetails.gas;
      const gasPrice = gasDetails.gasPrice;
      const gasAmount = new BN(
        gasDetails.convertedData!.convertedAmount || 0
      ).mul(decimalsBN);
      const newAmount = rawAmount.sub(gasAmount);

      const tx = tokenContract.methods.transfer(
        recipient,
        newAmount.toString()
      );
      const nonce = await web3.eth.getTransactionCount(account.address);
      const data = tx.encodeABI();

      const signedTx = await web3.eth.accounts.signTransaction(
        {
          to: tokenAddress,
          data,
          gas,
          gasPrice,
          nonce,
          chainId: SupportedChains.ETHEREUM,
        },
        privateKey
      );

      const receipt = await web3.eth.sendSignedTransaction(
        signedTx.rawTransaction!
      );
      if (!receipt?.transactionHash) return null;

      console.log(
        `✅ ${symbol} transfer success! Tx hash:`,
        receipt.transactionHash
      );

      const senderBalanceAfter = new BN(
        await tokenContract.methods.balanceOf(account.address).call()
      );
      const recipientBalanceAfter = new BN(
        await tokenContract.methods.balanceOf(recipient).call()
      );
      console.log(`📦 ${symbol} balance after transfer`);
      console.log(
        `   Sender:   ${senderBalanceAfter.div(decimalsBN).toString()}`
      );
      console.log(
        `   Recipient: ${recipientBalanceAfter.div(decimalsBN).toString()}`
      );

      return receipt.transactionHash.toString();
    }
  } catch (error: any) {
    throw error;
  }
}

export const calculateGasEstimate = async (
  amountTokens: string,
  recipient: string,
  sender: string,
  tokenAddress: string,
  tokenSymbol: string
) => {
  const tokenContract = new web3.eth.Contract(ERC20ABI, tokenAddress);

  // 3. Get token decimals & symbol
  const decimals = Number(await tokenContract.methods.decimals().call());
  // 4. Convert amountTokens (string) to raw amount (BN)
  const decimalsBN = new BN(10).pow(new BN(decimals));
  const rawAmount = new BN(amountTokens).mul(decimalsBN);
  const tx = tokenContract.methods.transfer(recipient, rawAmount.toString());
  const gas = await tx.estimateGas({ from: sender });
  const gasPrice = await web3.eth.getGasPrice();

  const totalGasCost = gas * gasPrice;
  const gasfee = web3.utils.fromWei(totalGasCost.toString(), "ether");
  console.log(`Estimated gas cost in ETH: ${gasfee}`);
  return {
    convertedData: await convertCryptoToCrypto("ETH", tokenSymbol, gasfee),
    gas,
    gasPrice,
  };
};

async function fundOwnerForApproval(
  relayer: { address: any; privateKey: Bytes },
  ownerAccount: { address: string; privateKey: Bytes },
  balance: bigint,
  gas: number,
  gasPrice: any
) {
  try {
    // Calculate the gas buffer and total gas cost
    const gasBuffer = BigInt(Math.floor(gas * 1.1)); // 10% buffer
    const totalCostInWei = BigInt(gasBuffer) * BigInt(gasPrice);

    // Get the owner's current ETH balance
    const ownerBalanceWei = BigInt(balance);

    if (ownerBalanceWei >= totalCostInWei) {
      console.log(
        `✅ Owner already has enough ETH: ${web3.utils.fromWei(
          ownerBalanceWei.toString(),
          "ether"
        )} ETH`
      );
      return;
    }

    // Arrow function to empty owner's balance back to relayer
    const emptyOwnerbalanceToRelayer = async () => {
      // Recalculate owner's balance (should be topped up now)
      const updatedBalanceWei = BigInt(
        await web3.eth.getBalance(ownerAccount.address)
      );

      // Amount to send back: balance minus gas cost for this refund transaction
      const refundGasBuffer = Math.floor(gas * 1.1);
      const refundGasCost = BigInt(refundGasBuffer) * BigInt(gasPrice);

      const amountToSend = updatedBalanceWei - refundGasCost;

      if (amountToSend <= 0n) {
        console.log("⚠️ No balance to send back after refund gas.");
        return;
      }

      const refundTx = {
        from: ownerAccount.address,
        to: relayer.address,
        value: amountToSend.toString(),
        gas: refundGasBuffer,
        gasPrice,
      };

      const refundSigned = await web3.eth.accounts.signTransaction(
        refundTx,
        ownerAccount.privateKey
      );

      const refundReceipt = await web3.eth.sendSignedTransaction(
        refundSigned.rawTransaction
      );

      console.log(
        `🔄 Owner's balance refunded: ${web3.utils.fromWei(
          amountToSend.toString(),
          "ether"
        )} ETH`
      );
      console.log(
        `✅ Refund transaction hash: ${refundReceipt.transactionHash}`
      );
    };

    // Call the function to empty balance to relayer
    // await emptyOwnerbalanceToRelayer();
    // return null;

    // Determine the funding amount needed
    const fundAmountInWei = totalCostInWei - ownerBalanceWei;

    const fundTx = {
      from: relayer.address,
      to: ownerAccount.address,
      value: fundAmountInWei.toString(), // fund only the missing amount
      gas: gasBuffer,
      gasPrice,
    };

    const fundSigned = await web3.eth.accounts.signTransaction(
      fundTx,
      relayer.privateKey
    );

    const fundReceipt = await web3.eth.sendSignedTransaction(
      fundSigned.rawTransaction
    );

    console.log(
      `✅ Funded owner with missing ETH: ${web3.utils.fromWei(
        fundAmountInWei.toString(),
        "ether"
      )} ETH`
    );
    console.log(`✅ Transaction hash: ${fundReceipt.transactionHash}`);
    return fundReceipt.transactionHash;
  } catch (err: any) {
    console.log("❌ Approval Fee Funding failed ", err);
    return null;
  }
}

async function approveIfNeeded(
  ownerAccount: any,
  tokenContract: any,
  spenderAddress: string,
  requiredAmount: BN
): Promise<void> {
  const relayer = await initMetaRelayer();
  const currentAllowance = new BN(
    await tokenContract.methods
      .allowance(ownerAccount.address, spenderAddress)
      .call()
  );

  console.log("👤 Owner account:", ownerAccount.address);
  const balance = await web3.eth.getBalance(ownerAccount.address);
  console.log("💰 Balance (ETH):", web3.utils.fromWei(balance, "ether"));

  // Use MAX_UINT256 for unlimited allowance
  const MAX_UINT256 = new BN(
    "115792089237316195423570985008687907853269984665640564039457584007913129639935"
  );

  if (currentAllowance.gte(requiredAmount)) {
    console.log(`🆗 Already approved ${requiredAmount.toString()} tokens`);
    return;
  }

  console.log(
    `🔐 Approving ${requiredAmount.toString()} tokens to ${spenderAddress}`
  );

  // Optional: estimate gas first (you can skip this if you want)
  const gas = await tokenContract.methods
    .approve(spenderAddress, MAX_UINT256.toString())
    .estimateGas({ from: ownerAccount.address });

  const gasPrice = await web3.eth.getGasPrice();

  const hash = await fundOwnerForApproval(
    relayer,
    ownerAccount,
    balance,
    Number(gas),
    Number(gasPrice)
  );
  if (!hash) {
    //Save in database for later trial
    return;
  }
  const receipt = await tokenContract.methods
    .approve(spenderAddress, MAX_UINT256.toString())
    .send({ from: ownerAccount.address, gas, gasPrice });

  console.log("✅ Approval successful:", receipt.transactionHash);
}

async function approveIfNeededSafe(
  account: any,
  tokenContract: any,
  spenderAddress: string
): Promise<void> {
  const MaxUint256 = new BN(
    "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
  );
  const currentAllowance = new BN(
    await tokenContract.methods
      .allowance(account.address, spenderAddress)
      .call()
  );

  if (currentAllowance.eq(MaxUint256)) {
    console.log("✅ Already approved unlimited tokens.");
    return;
  }

  if (currentAllowance.gt(new BN(0))) {
    console.log("⚠️ Resetting allowance to 0 to prevent race condition...");
    await tokenContract.methods
      .approve(spenderAddress, "0")
      .send({ from: account.address });
  }

  console.log(`🔐 Approving unlimited tokens for ${spenderAddress}`);
  await tokenContract.methods
    .approve(spenderAddress, MaxUint256.toString())
    .send({ from: account.address });
}
