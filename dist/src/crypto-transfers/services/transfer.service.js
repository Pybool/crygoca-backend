"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferNativeETH = exports.transferERC20 = void 0;
const erc_transfers_1 = require("./erc-transfers");
const eth_native_transfers_1 = require("./eth-native-transfers");
async function transferERC20(checkOutId, tokenAddress, recipient, amount, decimals, privateKey) {
    try {
        const transferHash = await (0, erc_transfers_1.transferERC20Token)(privateKey, tokenAddress, recipient, amount);
        console.log("[Transfer Response] ", transferHash);
        return transferHash;
    }
    catch (error) {
        throw error;
    }
}
exports.transferERC20 = transferERC20;
async function transferNativeETH(recipient, amount, privateKey) {
    const txHash = await (0, eth_native_transfers_1.transferNativeETHEREUM)(recipient, amount, privateKey);
    return txHash;
}
exports.transferNativeETH = transferNativeETH;
