"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterNativeETHPayout = exports.RegisterERC20Payout = void 0;
const enqueueTransfer_1 = require("../../../crypto-transfers/scripts/enqueueTransfer");
const tokens_config_1 = require("../../../escrow/config/tokens.config");
const RegisterERC20Payout = (listingPurchase, order, escrowId, platform) => {
    console.log("[ HANDLER ]: RegisterERC20Payout");
    const token = tokens_config_1.ERC20_TOKENS.find((t) => t.symbol.toUpperCase() ===
        listingPurchase.cryptoListing.cryptoCode.toUpperCase());
    if (!token) {
        return { status: false, message: "Token not supported" };
    }
    if (process.env.NODE_ENV === "prod") {
        if (platform.token_address.toLowercase() !== token.address.toLowerCase()) {
            throw new Error("Non-matching token addresses");
        }
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
    };
    (0, enqueueTransfer_1.ERC20Transfer)("erc20", data).then(() => {
        console.log("📥 ERC20 payout queued successfully..");
    });
};
exports.RegisterERC20Payout = RegisterERC20Payout;
const RegisterNativeETHPayout = (listingPurchase, order, escrowId) => { };
exports.RegisterNativeETHPayout = RegisterNativeETHPayout;
