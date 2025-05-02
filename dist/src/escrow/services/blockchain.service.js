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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.listenToETH = exports.listenToERC20 = void 0;
const web3_1 = __importDefault(require("../config/web3"));
const dotenv_1 = __importDefault(require("dotenv"));
const tokens_config_1 = require("../config/tokens.config");
const depositIntent_model_1 = require("../../models/depositIntent.model");
const notify_ui_1 = require("./notify-ui");
const saleListing_model_1 = __importDefault(require("../../models/saleListing.model"));
const escrow_model_1 = __importDefault(require("../../models/escrow.model"));
const mongoose_1 = __importDefault(require("mongoose")); // ✅ added mongoose
dotenv_1.default.config();
const ESCROW_ADDRESS = (_a = process.env.ESCROW_ADDRESS) === null || _a === void 0 ? void 0 : _a.toLowerCase();
const ERC20_ABI = [
    {
        anonymous: false,
        inputs: [
            { indexed: true, name: "from", type: "address" },
            { indexed: true, name: "to", type: "address" },
            { indexed: false, name: "value", type: "uint256" },
        ],
        name: "Transfer",
        type: "event",
    },
];
const listenToERC20 = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Starting erc20 listener");
    const ERC20_TRANSFER_TOPIC = web3_1.default.utils.sha3("Transfer(address,address,uint256)");
    const subscription = yield web3_1.default.eth.subscribe("logs", {
        address: tokens_config_1.ERC20_TOKENS.map((token) => token.address),
        topics: [
            ERC20_TRANSFER_TOPIC,
            null,
            web3_1.default.utils.padLeft(ESCROW_ADDRESS, 64),
        ],
    });
    subscription.on("data", (log) => __awaiter(void 0, void 0, void 0, function* () {
        var _b, _c, _d;
        const token = tokens_config_1.ERC20_TOKENS.find((t) => t.address.toLowerCase() === log.address.toLowerCase());
        if (!token)
            return;
        const decoded = web3_1.default.eth.abi.decodeLog([
            { type: "address", name: "from", indexed: true },
            { type: "address", name: "to", indexed: true },
            { type: "uint256", name: "value" },
        ], log.data, log.topics.slice(1));
        const value = Number(decoded.value) / Math.pow(10, token.decimals);
        const filter = {
            sender: decoded.from.toLowerCase(),
            tokenAddress: (_b = token.address) === null || _b === void 0 ? void 0 : _b.toLowerCase(),
            status: "pending",
            amount: value.toString(),
            receivingAddress: (_c = decoded.to) === null || _c === void 0 ? void 0 : _c.toLowerCase(),
        };
        const match = yield depositIntent_model_1.DepositIntent.findOne(filter);
        if (match) {
            const session = yield mongoose_1.default.startSession();
            try {
                session.startTransaction();
                match.status = "confirmed";
                match.txHash = log.transactionHash; // ✅ fixed from decoded.hash to log.transactionHash
                const listing = yield saleListing_model_1.default.findOne({
                    _id: match.listing,
                }).session(session);
                if (listing) {
                    const data = {
                        account: (_d = listing.account) === null || _d === void 0 ? void 0 : _d.toString(),
                        totalEscrowBalance: value,
                        availableEscrowBalance: value,
                        lockedEscrowBalance: 0,
                    };
                    const escrow = yield escrow_model_1.default.create([data], { session });
                    listing.depositConfirmed = true;
                    listing.escrow = escrow[0]._id;
                    yield match.save({ session });
                    yield listing.save({ session });
                }
                yield session.commitTransaction();
                console.log(`ERC20 deposit confirmed for ${match.intentId}`);
                (0, notify_ui_1.sendTransferNotification)(match.account.toString(), match);
                console.log(`📦 ERC20 (${token.symbol}) deposit: from ${decoded.from} → ${decoded.to} | amount: ${value}`);
            }
            catch (error) {
                console.error("ERC20 Transaction error: ", error);
                yield session.abortTransaction();
            }
            finally {
                session.endSession();
            }
        }
    }));
});
exports.listenToERC20 = listenToERC20;
const listenToETH = () => __awaiter(void 0, void 0, void 0, function* () {
    web3_1.default.eth.subscribe("pendingTransactions", (err, txHash) => __awaiter(void 0, void 0, void 0, function* () {
        var _e;
        if (err)
            return;
        const tx = yield web3_1.default.eth.getTransaction(txHash);
        if (!tx || ((_e = tx.to) === null || _e === void 0 ? void 0 : _e.toLowerCase()) !== ESCROW_ADDRESS)
            return;
        console.log("Pending transaction ", tx);
    }));
    (yield web3_1.default.eth.subscribe("newBlockHeaders")).on("data", (blockHeader) => __awaiter(void 0, void 0, void 0, function* () {
        const block = yield web3_1.default.eth.getBlock(blockHeader.hash, true);
        block.transactions.forEach((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _f, _g, _h;
            if (((_f = tx.to) === null || _f === void 0 ? void 0 : _f.toLowerCase()) === ESCROW_ADDRESS) {
                const value = Number(tx.value) / Math.pow(10, 18);
                const filter = {
                    sender: tx.from.toLowerCase(),
                    tokenAddress: "native_eth",
                    status: "pending",
                    amount: value,
                    receivingAddress: (_g = tx.to) === null || _g === void 0 ? void 0 : _g.toLowerCase(),
                };
                const match = yield depositIntent_model_1.DepositIntent.findOne(filter);
                if (match) {
                    const session = yield mongoose_1.default.startSession();
                    try {
                        session.startTransaction();
                        match.status = "confirmed";
                        match.txHash = tx.hash;
                        const listing = yield saleListing_model_1.default.findOne({
                            _id: match.listing,
                        }).session(session);
                        if (listing) {
                            const data = {
                                account: (_h = listing.account) === null || _h === void 0 ? void 0 : _h.toString(),
                                totalEscrowBalance: value,
                                availableEscrowBalance: value,
                                lockedEscrowBalance: 0,
                            };
                            const escrow = yield escrow_model_1.default.create([data], { session });
                            listing.depositConfirmed = true;
                            listing.escrow = escrow[0]._id;
                            yield match.save({ session });
                            yield listing.save({ session });
                            yield session.commitTransaction();
                            console.log(`ETH deposit confirmed for ${match.intentId}`);
                            console.log("💸 Escrow deposit detected!", tx);
                            (0, notify_ui_1.sendTransferNotification)(match.account.toString(), match);
                        }
                    }
                    catch (error) {
                        console.error("ETH Transaction error: ", error);
                        yield session.abortTransaction();
                    }
                    finally {
                        session.endSession();
                    }
                }
            }
        }));
    }));
});
exports.listenToETH = listenToETH;
