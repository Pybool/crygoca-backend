import { parseUnits, parseEther } from "ethers/lib/utils";
import { Contract } from "ethers";
import ERC20 from "@openzeppelin/contracts/build/contracts/ERC20.json";
import Escrow from "../../models/escrow.model";

const hre = require("hardhat");

export async function transferERC20(
  checkOutId:string,
  tokenAddress: string,
  recipient: string,
  amount: string,
  decimals: number,
  signer: any
) {
  const contract: Contract = new hre.ethers.Contract(
    tokenAddress,
    ERC20.abi,
    signer
  );
  console.log("parsedAmount ----> ", amount, decimals);
  const parsedAmount = parseUnits(amount, decimals);
  console.log("Paresd amount ", parsedAmount);
  // const tx = await contract.transfer(recipient, parsedAmount);
  // await tx.wait();
  // return tx.hash;
  return "";
}

export async function transferNativeETH(
  recipient: string,
  amount: string,
  signer: any
) {
  // const tx = await signer.sendTransaction({
  //   to: recipient,
  //   value: parseEther(amount),
  // });
  // await tx.wait();
  // return tx.hash;
  return "";
}
