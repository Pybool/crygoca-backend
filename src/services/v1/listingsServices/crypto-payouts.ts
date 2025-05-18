import {
  ERC20Transfer,
  IErc20Transfer,
} from "../../../crypto-transfers/scripts/enqueueTransfer";
import { ERC20_TOKENS } from "../../../escrow/config/tokens.config";

export const RegisterERC20Payout = (
  listingPurchase: any,
  order: any,
  escrowId: string,
  platform: any
) => {
  console.log("[ HANDLER ]: RegisterERC20Payout");
  const token = ERC20_TOKENS.find(
    (t) =>
      t.symbol.toUpperCase() ===
      listingPurchase.cryptoListing.cryptoCode.toUpperCase()
  );

  if (!token) {
    return { status: false, message: "Token not supported" };
  }

  // if (process.env.NODE_ENV === "prod") {
  //   if (platform.token_address.toLowerCase() !== token!.address.toLowerCase()) {
  //     throw new Error("Non-matching token addresses");
  //   }
  // }

  const tokenAddress = token?.address;
  const data: IErc20Transfer = {
    userId: order.buyer,
    escrowId,
    checkOutId: listingPurchase.checkOutId,
    recipient: order.walletToFund,
    type: "erc20",
    symbol: listingPurchase.cryptoListing.cryptoCode,
    amount: order.amount.toString(),
    tokenAddress: tokenAddress,
    decimals: token.decimals,
  };
  ERC20Transfer("erc20", data).then(() => {
    console.log("📥 ERC20 payout queued successfully..");
  });
};

export const RegisterNativeETHPayout = (
  listingPurchase: any,
  order: any,
  escrowId: string
) => {};
