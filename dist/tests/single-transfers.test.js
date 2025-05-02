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
const config_1 = require("../config");
const logger_1 = __importDefault(require("../src/bootstrap/logger"));
const wallet_model_1 = require("../src/models/wallet.model");
const common_1 = require("./common");
const events_1 = require("events");
let transferPayloads = [];
let clonedTransferPayloads = [];
// Create an EventEmitter instance
const eventEmitter = new events_1.EventEmitter();
const transferEmitter = new events_1.EventEmitter();
const defaultBalance = 4000;
let { sender, recipient } = (0, common_1.getRandomUserPair)();
beforeAll(() => {
    initializeTest();
    console.log = jest.fn(); // Mock console.log
});
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    (0, config_1.updateTestConfig)("TEST_ERROR", "false");
}));
const initializeTest = () => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info("==========================Initilaizing tests==================================");
    try {
        yield wallet_model_1.Wallet.deleteMany();
        for (const user of Object.values(common_1.CREDENTIALS)) {
            yield (0, common_1.delay)(1000);
            yield (0, common_1.createWallets)(user.email);
        }
    }
    catch (_a) { }
});
const buildTransferPayload = (createOtp = true) => {
    return [
        {
            debitDetails: {
                walletAccountNo: sender.wallet.walletAccountNo,
            },
            creditDetails: {
                walletAccountNo: recipient.wallet.walletAccountNo,
            },
            sourceAmount: Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000,
            sourceCurrency: sender.wallet.currency,
            targetCurrency: recipient.wallet.currency,
            saveBeneficiary: false,
            token: sender.token,
            createOtp: createOtp,
        },
    ];
};
const startUp = (createOtp) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, common_1.delay)(10000);
    const user1TokenResponse = yield (0, common_1.getLoginToken)(sender.email, sender.password);
    if (user1TokenResponse) {
        (0, common_1.updateCredentialProperty)(sender.email, "token", user1TokenResponse.accessToken);
    }
    logger_1.default.info("Waiting for tokens to be set on users' credentials");
    yield (0, common_1.delay)(4000);
    transferPayloads = buildTransferPayload(createOtp);
    clonedTransferPayloads = JSON.parse(JSON.stringify(transferPayloads));
    eventEmitter.emit("transferPayloads", transferPayloads);
});
eventEmitter.on("transferPayloads", (payloads) => __awaiter(void 0, void 0, void 0, function* () {
    const transferResponses = yield (0, common_1.makeTransfer)(payloads);
    transferEmitter.emit("transferComplete", transferResponses);
}));
const ensureTransferFailed = () => __awaiter(void 0, void 0, void 0, function* () {
    const user1WalletDB = yield wallet_model_1.Wallet.findOne({
        walletAccountNo: sender.wallet.walletAccountNo,
    });
    const user2WalletDB = yield wallet_model_1.Wallet.findOne({
        walletAccountNo: recipient.wallet.walletAccountNo,
    });
    logger_1.default.info("user1WalletDB Balance : " + user1WalletDB.balance);
    logger_1.default.info("user2WalletDB Balance : " + user2WalletDB.balance);
    if (user1WalletDB.balance == defaultBalance &&
        user2WalletDB.balance == defaultBalance) {
        return true;
    }
    else {
        return false;
    }
});
describe("Single transfer APIs Test", () => {
    it("Ensure when a transfer fails, the account balances of the sender and receiver must remain the same.", () => __awaiter(void 0, void 0, void 0, function* () {
        (0, config_1.updateTestConfig)("TEST_ERROR", "true");
        const transferPromise = new Promise((resolve) => {
            transferEmitter.once("transferComplete", (transferResponses) => {
                resolve(transferResponses);
            });
        });
        yield startUp(true);
        const response = yield transferPromise;
        expect(response[0]).not.toBeNull();
        logger_1.default.info("Transfer Responses " + JSON.stringify(response, null, 2));
        const successPromise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, 6000);
        });
        yield successPromise;
        const transactionFailed = yield ensureTransferFailed();
        logger_1.default.info(`Account balances remain unchanged ${transactionFailed}`);
        (0, config_1.updateTestConfig)("TEST_ERROR", "false");
        expect(true).toEqual(transactionFailed);
    }));
    it("Ensure if the database becomes unavailable during a transfer the tranfer details are stored in redis backup", () => __awaiter(void 0, void 0, void 0, function* () {
        // updateTestConfig("DISCONNECT_DATABASE", "true");
        // const transferPromise = new Promise((resolve) => {
        //   transferEmitter.once("transferComplete", (transferResponses) => {
        //     resolve(transferResponses);
        //   });
        // });
        // await startUp(true);
        // const response: any = await transferPromise;
        // expect(response[0]).not.toBeNull()
        // logger.info("Transfer Responses " + JSON.stringify(response, null, 2));
        // const successPromise = new Promise((resolve) => {
        //   setTimeout(() => {
        //     resolve(true);
        //   }, 6000);
        // });
        // await successPromise;
        // const transactionFailed = await ensureTransferFailed();
        // logger.info(`Account balances remain unchanged ${transactionFailed}`)
        // const failedTransactionIds = getTestConfig().failedTransactionIds;
        // for(let failedTransactionId of failedTransactionIds){
        //   const failedTransaction = await getRollbackById(failedTransactionId);
        //   logger.info(`failedTransaction===>${failedTransactionId} :== ${JSON.stringify(failedTransaction, null, 2)}`)
        //   expect(failedTransaction).not.toBeNull();
        // }
        // updateTestConfig("failedTransactionIds", []);
    }));
});
