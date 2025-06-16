"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recoverEthSigner = exports.signEthMetaTransfer = exports.recoverSigner = exports.signMetaTransfer = void 0;
const ethers_1 = require("ethers");
async function signMetaTransfer({ signer, token, from, to, amount, nonce, deadline, chainId, verifyingContract, }) {
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
    return ethers_1.ethers.utils.splitSignature(signature);
}
exports.signMetaTransfer = signMetaTransfer;
function recoverSigner({ v, r, s, token, from, to, amount, nonce, deadline, chainId, verifyingContract, }) {
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
    const digest = ethers_1.ethers.utils._TypedDataEncoder.hash(domain, types, message);
    return ethers_1.ethers.utils.recoverAddress(digest, { v, r, s });
}
exports.recoverSigner = recoverSigner;
async function signEthMetaTransfer({ signer, from, to, amount, nonce, deadline, chainId, verifyingContract, }) {
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
    return ethers_1.ethers.utils.splitSignature(signature);
}
exports.signEthMetaTransfer = signEthMetaTransfer;
function recoverEthSigner({ v, r, s, from, to, amount, nonce, deadline, chainId, verifyingContract, }) {
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
    const digest = ethers_1.ethers.utils._TypedDataEncoder.hash(domain, types, message);
    return ethers_1.ethers.utils.recoverAddress(digest, { v, r, s });
}
exports.recoverEthSigner = recoverEthSigner;
