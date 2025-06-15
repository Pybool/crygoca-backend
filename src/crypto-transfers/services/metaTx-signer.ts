import { ethers } from "ethers";

interface SignMetaTransferParams {
  signer: ethers.Wallet;
  token?: string;
  from: string;
  to: string;
  amount: ethers.BigNumberish;
  nonce: ethers.BigNumberish;
  deadline: ethers.BigNumberish;
  chainId: number;
  verifyingContract: string; // MetaTransfer contract address
}

export async function signMetaTransfer({
  signer,
  token,
  from,
  to,
  amount,
  nonce,
  deadline,
  chainId,
  verifyingContract,
}: SignMetaTransferParams) {
  const domain = {
    name: "ERC20MetaTransfer",
    version: "1",
    chainId,
    verifyingContract,
  };

  const types = {
    ERC20MetaTransfer: [
      { name: "token", type: "address" },
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const message = {
    token,
    from,
    to,
    amount,
    nonce,
    deadline,
  };

  const signature = await signer._signTypedData(domain, types, message);
  return ethers.utils.splitSignature(signature);
}

export function recoverSigner({
  v,
  r,
  s,
  token,
  from,
  to,
  amount,
  nonce,
  deadline,
  chainId,
  verifyingContract,
}: {
  v: number;
  r: string;
  s: string;
  token: string;
  from: string;
  to: string;
  amount: ethers.BigNumberish;
  nonce: ethers.BigNumberish;
  deadline: ethers.BigNumberish;
  chainId: number;
  verifyingContract: string;
}) {
  const domain = {
    name: "ERC20MetaTransfer",
    version: "1",
    chainId,
    verifyingContract,
  };

  const types = {
    ERC20MetaTransfer: [
      { name: "token", type: "address" },
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const message = {
    token,
    from,
    to,
    amount,
    nonce,
    deadline,
  };

  const digest = ethers.utils._TypedDataEncoder.hash(domain, types, message);
  console.log("digest==> ", digest)
  return ethers.utils.recoverAddress(digest, { v, r, s });
}

export async function signEthMetaTransfer({
  signer,
  from,
  to,
  amount,
  nonce,
  deadline,
  chainId,
  verifyingContract,
}: SignMetaTransferParams) {
  const domain = {
    name: "ETHMetaTransfer",
    version: "1",
    chainId,
    verifyingContract,
  };

  const types = {
    ETHMetaTransfer: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const message = {
    from,
    to,
    amount,
    nonce,
    deadline,
  };

  const signature = await signer._signTypedData(domain, types, message);
  return ethers.utils.splitSignature(signature);
}

export function recoverEthSigner({
  v,
  r,
  s,
  from,
  to,
  amount,
  nonce,
  deadline,
  chainId,
  verifyingContract,
}: {
  v: number;
  r: string;
  s: string;
  from: string;
  to: string;
  amount: ethers.BigNumberish;
  nonce: ethers.BigNumberish;
  deadline: ethers.BigNumberish;
  chainId: number;
  verifyingContract: string;
}) {
  const domain = {
    name: "ETHMetaTransfer",
    version: "1",
    chainId,
    verifyingContract,
  };

  const types = {
    ETHMetaTransfer: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const message = {
    from,
    to,
    amount,
    nonce,
    deadline,
  };

  const digest = ethers.utils._TypedDataEncoder.hash(domain, types, message);
  console.log("digest==> ", digest)
  return ethers.utils.recoverAddress(digest, { v, r, s });
}


