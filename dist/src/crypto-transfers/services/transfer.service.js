"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferNativeETH = exports.transferERC20 = void 0;
const utils_1 = require("ethers/lib/utils");
const ERC20_json_1 = __importDefault(require("@openzeppelin/contracts/build/contracts/ERC20.json"));
const hre = require("hardhat");
async function transferERC20(checkOutId, tokenAddress, recipient, amount, decimals, signer) {
    const contract = new hre.ethers.Contract(tokenAddress, ERC20_json_1.default.abi, signer);
    console.log("parsedAmount ----> ", amount, decimals);
    const parsedAmount = (0, utils_1.parseUnits)(amount, decimals);
    console.log("Paresd amount ", parsedAmount);
    // const tx = await contract.transfer(recipient, parsedAmount);
    // await tx.wait();
    // return tx.hash;
    return "";
}
exports.transferERC20 = transferERC20;
async function transferNativeETH(recipient, amount, signer) {
    // const tx = await signer.sendTransaction({
    //   to: recipient,
    //   value: parseEther(amount),
    // });
    // await tx.wait();
    // return tx.hash;
    return "";
}
exports.transferNativeETH = transferNativeETH;
