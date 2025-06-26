"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementNonce = exports.getNonce = exports.relayTransfer = exports.createSignedTransfer = exports.initMetaRelayer = exports.setUpRelayer = void 0;
const bn_js_1 = __importDefault(require("bn.js"));
const dotenv_1 = __importDefault(require("dotenv"));
const ERC20MetaTransfer_json_1 = __importDefault(require("../../../artifacts/contracts/ERC20MetaTransfer.sol/ERC20MetaTransfer.json"));
const accounts_chain_wallets_1 = __importDefault(require("../../models/accounts-chain-wallets"));
const web3_1 = __importDefault(require("../../escrow/config/web3"));
const depositWallets_service_1 = require("../../services/v1/escrow/depositWallets.service");
const supported_chains_1 = require("../../services/v1/escrow/supported-chains");
const mongoose_1 = __importDefault(require("mongoose"));
const accounts_model_1 = __importDefault(require("../../models/accounts.model"));
const metaTx_signer_1 = require("./metaTx-signer");
const helpers_1 = require("../../services/v1/helpers");
const ethers_1 = require("ethers");
dotenv_1.default.config();
const depth = Number(process.env.ENC_DEPTH || '1');
const META_TX_CONTRACT_ADDRESS = process.env.META_TX_CONTRACT_ADDRESS;
let relayer = null;
let metaTransfer;
let ethChainId = 11155111; //sepolia testnet
if (process.env.NODE_ENV == 'prod') {
    ethChainId = 1;
}
async function setUpRelayer() {
    let relayerWallet = await accounts_chain_wallets_1.default.findOne({
        chainId: supported_chains_1.SupportedChains.ETHEREUM,
        isRelayer: true,
    });
    let crygocaPlatform = await accounts_model_1.default.findOne({ isPlatform: true });
    if (!crygocaPlatform) {
        throw new Error("[Relayer] No relayer account configured");
    }
    if (!relayerWallet || !relayerWallet.privateKey) {
        const session = await mongoose_1.default.startSession();
        relayerWallet = (await depositWallets_service_1.DepositWallets.createWallet(crygocaPlatform._id, supported_chains_1.SupportedChains.ETHEREUM, session, true));
    }
    return relayerWallet;
}
exports.setUpRelayer = setUpRelayer;
async function initMetaRelayer() {
    if (relayer) {
        return relayer;
    }
    let relayerWallet = await accounts_chain_wallets_1.default.findOne({
        chainId: supported_chains_1.SupportedChains.ETHEREUM,
        isRelayer: true,
    });
    let crygocaPlatform = await accounts_model_1.default.findOne({ isPlatform: true });
    // if (!crygocaPlatform) {
    //   crygocaPlatform = await Accounts.create({
    //     email: "relayaccount@crygoca.com",
    //     firstname: "relaycrygoca",
    //     username: "relaycrygoca",
    //     password: "@1011101errtyyuyuiy1qweQWE",
    //     isPlatform: true,
    //   });
    // }
    if (!relayerWallet || !relayerWallet.privateKey) {
        const session = await mongoose_1.default.startSession();
        relayerWallet = (await depositWallets_service_1.DepositWallets.createWallet(crygocaPlatform._id, supported_chains_1.SupportedChains.ETHEREUM, session, true));
    }
    if (!relayerWallet) {
        throw new Error("[Relayer] No relayer wallet configured in DB.");
    }
    const PRIVATE_KEY_RELAY = (0, helpers_1.decryptDataString)(relayerWallet.privateKey, depth);
    relayer = web3_1.default.eth.accounts.privateKeyToAccount(PRIVATE_KEY_RELAY);
    web3_1.default.eth.accounts.wallet.add(relayer);
    metaTransfer = new web3_1.default.eth.Contract(ERC20MetaTransfer_json_1.default.abi, META_TX_CONTRACT_ADDRESS);
    return relayer;
}
exports.initMetaRelayer = initMetaRelayer;
/**
 * Creates a signed meta-transaction payload
 */
async function createSignedTransfer({ tokenAddress, fromPrivateKey, to, amount, deadline, }) {
    const fromAccount = web3_1.default.eth.accounts.privateKeyToAccount(fromPrivateKey);
    const from = fromAccount.address;
    const nonce = await getNonce(from);
    const signer = new ethers_1.ethers.Wallet(fromPrivateKey);
    if (tokenAddress !== "native_eth") {
        const { v, r, s } = await (0, metaTx_signer_1.signMetaTransfer)({
            signer,
            token: tokenAddress,
            from,
            to,
            amount,
            nonce,
            deadline,
            chainId: ethChainId,
            verifyingContract: META_TX_CONTRACT_ADDRESS, // The deployed address of ERC20MetaTransfer
        });
        const recoveredAddress = (0, metaTx_signer_1.recoverSigner)({
            v,
            r,
            s,
            token: tokenAddress,
            from,
            to,
            amount,
            nonce,
            deadline,
            chainId: ethChainId, // example: Sepolia
            verifyingContract: META_TX_CONTRACT_ADDRESS, // ERC20MetaTransfer contract address
        });
        return {
            from,
            to,
            amount,
            token: tokenAddress,
            nonce,
            deadline,
            v,
            r,
            s,
        };
    }
    else {
        const { v, r, s } = await (0, metaTx_signer_1.signEthMetaTransfer)({
            signer,
            from,
            to,
            amount,
            nonce,
            deadline,
            chainId: ethChainId,
            verifyingContract: META_TX_CONTRACT_ADDRESS, // The deployed address of ERC20MetaTransfer
        });
        const recoveredAddress = (0, metaTx_signer_1.recoverEthSigner)({
            v,
            r,
            s,
            from,
            to,
            amount,
            nonce,
            deadline,
            chainId: ethChainId, // example: Sepolia
            verifyingContract: META_TX_CONTRACT_ADDRESS, // ERC20MetaTransfer contract address
        });
        return {
            from,
            to,
            amount,
            nonce,
            deadline,
            v,
            r,
            s,
        };
    }
}
exports.createSignedTransfer = createSignedTransfer;
/**
 * Relays a meta-transaction using relayer account
 */
async function relayTransfer(metaTx, isEth = false) {
    if (!relayer || !metaTransfer) {
        throw new Error("[Relayer] Not initialized. Call initMetaRelayer() first.");
    }
    const gasPrice = await web3_1.default.eth.getGasPrice();
    const method = isEth
        ? metaTransfer.methods.metaTransferETH(metaTx.from.toLowerCase(), metaTx.to.toLowerCase(), metaTx.amount, metaTx.deadline, metaTx.v, metaTx.r, metaTx.s)
        : metaTransfer.methods.metaTransferERC20(metaTx.token, metaTx.from, metaTx.to, metaTx.amount, metaTx.deadline, metaTx.v, metaTx.r, metaTx.s);
    // Dynamically estimate gas to avoid hardcoding
    let estimatedGas = new bn_js_1.default(await method.estimateGas({ from: relayer.address }));
    // Add 10000 as BN
    estimatedGas = estimatedGas.add(new bn_js_1.default(10000));
    const receipt = await method
        .send({
        from: relayer.address,
        gas: estimatedGas.toString(),
        gasPrice,
    })
        .on("transactionHash", (hash) => {
        console.log(isEth ? "[Relay Native ETH]" : "[Relay ERC Token]", "Transaction sent:", hash);
    });
    await incrementNonce(metaTx.from);
    return receipt;
}
exports.relayTransfer = relayTransfer;
/**
 * Gets stored nonce from MongoDB
 */
async function getNonce(address) {
    const lower = address.toLowerCase();
    let doc = await accounts_chain_wallets_1.default.findOne({ address: lower });
    return doc?.nonce || 0;
}
exports.getNonce = getNonce;
/**
 * Increments stored nonce in MongoDB
 */
async function incrementNonce(address) {
    const lower = address.toLowerCase();
    await accounts_chain_wallets_1.default.findOneAndUpdate({ address: lower }, { $inc: { nonce: 1 } }, { upsert: true });
}
exports.incrementNonce = incrementNonce;
