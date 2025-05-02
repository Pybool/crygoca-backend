"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferNativeETH = exports.transferERC20 = void 0;
const utils_1 = require("ethers/lib/utils");
const ERC20_json_1 = __importDefault(require("@openzeppelin/contracts/build/contracts/ERC20.json"));
const hre = require("hardhat");
function transferERC20(checkOutId, tokenAddress, recipient, amount, decimals, signer) {
    return __awaiter(this, void 0, void 0, function* () {
        const contract = new hre.ethers.Contract(tokenAddress, ERC20_json_1.default.abi, signer);
        console.log("parsedAmount ----> ", amount, decimals);
        const parsedAmount = (0, utils_1.parseUnits)(amount, decimals);
        console.log("Paresd amount ", parsedAmount);
        // const tx = await contract.transfer(recipient, parsedAmount);
        // await tx.wait();
        // return tx.hash;
        return "";
    });
}
exports.transferERC20 = transferERC20;
function transferNativeETH(recipient, amount, signer) {
    return __awaiter(this, void 0, void 0, function* () {
        // const tx = await signer.sendTransaction({
        //   to: recipient,
        //   value: parseEther(amount),
        // });
        // await tx.wait();
        // return tx.hash;
        return "";
    });
}
exports.transferNativeETH = transferNativeETH;
