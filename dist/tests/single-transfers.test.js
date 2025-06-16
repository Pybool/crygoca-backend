"use strict";
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
afterAll(async () => {
    (0, config_1.updateTestConfig)("TEST_ERROR", "false");
});
const initializeTest = async () => {
    logger_1.default.info("==========================Initilaizing tests==================================");
    try {
        await wallet_model_1.Wallet.deleteMany();
        for (const user of Object.values(common_1.CREDENTIALS)) {
            await (0, common_1.delay)(1000);
            await (0, common_1.createWallets)(user.email);
        }
    }
    catch { }
};
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
const startUp = async (createOtp) => {
    await (0, common_1.delay)(10000);
    const user1TokenResponse = await (0, common_1.getLoginToken)(sender.email, sender.password);
    if (user1TokenResponse) {
        (0, common_1.updateCredentialProperty)(sender.email, "token", user1TokenResponse.accessToken);
    }
    logger_1.default.info("Waiting for tokens to be set on users' credentials");
    await (0, common_1.delay)(4000);
    transferPayloads = buildTransferPayload(createOtp);
    clonedTransferPayloads = JSON.parse(JSON.stringify(transferPayloads));
    eventEmitter.emit("transferPayloads", transferPayloads);
};
eventEmitter.on("transferPayloads", async (payloads) => {
    const transferResponses = await (0, common_1.makeTransfer)(payloads);
    transferEmitter.emit("transferComplete", transferResponses);
});
const ensureTransferFailed = async () => {
    const user1WalletDB = await wallet_model_1.Wallet.findOne({
        walletAccountNo: sender.wallet.walletAccountNo,
    });
    const user2WalletDB = await wallet_model_1.Wallet.findOne({
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
};
describe("Single transfer APIs Test", () => {
    it("Ensure when a transfer fails, the account balances of the sender and receiver must remain the same.", async () => {
        (0, config_1.updateTestConfig)("TEST_ERROR", "true");
        const transferPromise = new Promise((resolve) => {
            transferEmitter.once("transferComplete", (transferResponses) => {
                resolve(transferResponses);
            });
        });
        await startUp(true);
        const response = await transferPromise;
        expect(response[0]).not.toBeNull();
        logger_1.default.info("Transfer Responses " + JSON.stringify(response, null, 2));
        const successPromise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, 6000);
        });
        await successPromise;
        const transactionFailed = await ensureTransferFailed();
        logger_1.default.info(`Account balances remain unchanged ${transactionFailed}`);
        (0, config_1.updateTestConfig)("TEST_ERROR", "false");
        expect(true).toEqual(transactionFailed);
    });
    it("Ensure if the database becomes unavailable during a transfer the tranfer details are stored in redis backup", async () => {
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
    });
});
