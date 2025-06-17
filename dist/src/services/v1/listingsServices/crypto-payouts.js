"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterNativeETHPayout = exports.RegisterERC20Payout = void 0;
const enqueueTransfer_1 = require("../../../crypto-transfers/scripts/enqueueTransfer");
const tokens_config_1 = require("../../../escrow/config/tokens.config");
const accounts_chain_wallets_1 = __importDefault(require("../../../models/accounts-chain-wallets"));
const supported_chains_1 = require("../escrow/supported-chains");
const RegisterERC20Payout = async (listingPurchase, order, escrowId, platform) => {
    try {
        console.log("[ HANDLER ]: RegisterERC20Payout");
        const token = tokens_config_1.ERC20_TOKENS.find((t) => t.symbol.toUpperCase() ===
            listingPurchase.cryptoListing.cryptoCode.toUpperCase());
        if (!token) {
            return { status: false, message: "Token not supported" };
        }
        const blockchainWallet = await accounts_chain_wallets_1.default.findOne({
            account: listingPurchase.cryptoListing.account,
            chainId: supported_chains_1.SupportedChains.ETHEREUM,
        });
        if (!blockchainWallet) {
            return {
                status: false,
                message: "No source wallet was found for payout",
            };
        }
        const tokenAddress = token?.address;
        const data = {
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
        (0, enqueueTransfer_1.ERC20Transfer)("erc20", data).then(() => {
            console.log("📥 ERC20 payout queued successfully..");
        });
    }
    catch (error) {
        console.error(error);
    }
};
exports.RegisterERC20Payout = RegisterERC20Payout;
const RegisterNativeETHPayout = async (listingPurchase, order, escrowId) => {
    try {
        console.log("[ HANDLER ]: RegisterNativeETHPayout");
        const blockchainWallet = await accounts_chain_wallets_1.default.findOne({
            account: listingPurchase.cryptoListing.account,
            chainId: supported_chains_1.SupportedChains.ETHEREUM,
        });
        if (!blockchainWallet) {
            return {
                status: false,
                message: "No source wallet was found for payout",
            };
        }
        const data = {
            userId: order.buyer,
            escrowId,
            checkOutId: listingPurchase.checkOutId,
            recipient: order.walletToFund,
            type: "native",
            symbol: listingPurchase.cryptoListing.cryptoCode,
            amount: order.amount.toString(),
            blockchainWallet,
        };
        (0, enqueueTransfer_1.EthereumNetworkTransfer)(data.type, data).then(() => {
            console.log("📥 ETH Native payout queued successfully..");
        });
    }
    catch (error) {
        console.error(error);
    }
};
exports.RegisterNativeETHPayout = RegisterNativeETHPayout;
