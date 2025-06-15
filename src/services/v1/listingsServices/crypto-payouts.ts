import {
  ERC20Transfer,
  EthereumNetworkTransfer,
  IErc20Transfer,
  IEthTransfer,
} from "../../../crypto-transfers/scripts/enqueueTransfer";
import { ERC20_TOKENS } from "../../../escrow/config/tokens.config";
import BlockChainWallets from "../../../models/accounts-chain-wallets";
import { SupportedChains } from "../escrow/supported-chains";

export const RegisterERC20Payout = async (
  listingPurchase: any,
  order: any,
  escrowId: string,
  platform: any
) => {
  try {
    console.log("[ HANDLER ]: RegisterERC20Payout");
    const token = ERC20_TOKENS.find(
      (t) =>
        t.symbol.toUpperCase() ===
        listingPurchase.cryptoListing.cryptoCode.toUpperCase()
    );

    if (!token) {
      return { status: false, message: "Token not supported" };
    }

    const blockchainWallet = await BlockChainWallets.findOne({
      account: listingPurchase.cryptoListing.account,
      chainId: SupportedChains.ETHEREUM,
    });

    if (!blockchainWallet) {
      return {
        status: false,
        message: "No source wallet was found for payout",
      };
    }

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
      blockchainWallet,
    };
    ERC20Transfer("erc20", data).then(() => {
      console.log("📥 ERC20 payout queued successfully..");
    });
  } catch (error: any) {
    console.error(error);
  }
};

export const RegisterNativeETHPayout = async (
  listingPurchase: any,
  order: any,
  escrowId: string
) => {
  try {
    console.log("[ HANDLER ]: RegisterNativeETHPayout");
    const blockchainWallet = await BlockChainWallets.findOne({
      account: listingPurchase.cryptoListing.account,
      chainId: SupportedChains.ETHEREUM,
    });

    if (!blockchainWallet) {
      return {
        status: false,
        message: "No source wallet was found for payout",
      };
    }

    const data: IEthTransfer = {
      userId: order.buyer,
      escrowId,
      checkOutId: listingPurchase.checkOutId,
      recipient: order.walletToFund,
      type: "native",
      symbol: listingPurchase.cryptoListing.cryptoCode,
      amount: order.amount.toString(),
      blockchainWallet,
    };

    EthereumNetworkTransfer(data.type, data).then(() => {
      console.log("📥 ETH Native payout queued successfully..");
    });
  } catch (error: any) {
    console.error(error);
  }
};
