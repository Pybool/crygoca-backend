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
const logger_1 = __importDefault(require("../src/bootstrap/logger"));
const common_1 = require("./common");
const wallet_model_1 = require("../src/models/wallet.model");
const events_1 = require("events");
// Create an EventEmitter instance
const eventEmitter = new events_1.EventEmitter();
const transferEmitter = new events_1.EventEmitter();
const defaultBalance = 4000;
let transferPayloads = [];
let clonedTransferPayloads = [];
beforeAll(() => {
    initializeTest();
    console.log = jest.fn(); // Mock console.log
});
const initializeTest = () => __awaiter(void 0, void 0, void 0, function* () {
    logger_1.default.info("==========================Initilaizing tests==================================");
    try {
        yield wallet_model_1.Wallet.deleteMany();
        yield (0, common_1.delay)(4000);
        for (const user of Object.values(common_1.CREDENTIALS)) {
            yield (0, common_1.createWallets)(user.email);
        }
    }
    catch (_a) {
    }
});
const buildTransferPayload = (createOtp = true) => {
    return [
        {
            debitDetails: {
                walletAccountNo: common_1.CREDENTIALS.user1.wallet.walletAccountNo,
            },
            creditDetails: {
                walletAccountNo: common_1.CREDENTIALS.user2.wallet.walletAccountNo,
            },
            sourceAmount: Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000,
            sourceCurrency: common_1.CREDENTIALS.user1.wallet.currency,
            targetCurrency: common_1.CREDENTIALS.user2.wallet.currency,
            saveBeneficiary: false,
            token: common_1.CREDENTIALS.user1.token,
            createOtp: createOtp,
        },
        {
            debitDetails: {
                walletAccountNo: common_1.CREDENTIALS.user2.wallet.walletAccountNo,
            },
            creditDetails: {
                walletAccountNo: common_1.CREDENTIALS.user3.wallet.walletAccountNo,
            },
            sourceAmount: Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000,
            sourceCurrency: common_1.CREDENTIALS.user2.wallet.currency,
            targetCurrency: common_1.CREDENTIALS.user3.wallet.currency,
            saveBeneficiary: false,
            token: common_1.CREDENTIALS.user2.token,
            createOtp: createOtp,
        },
        {
            debitDetails: {
                walletAccountNo: common_1.CREDENTIALS.user3.wallet.walletAccountNo,
            },
            creditDetails: {
                walletAccountNo: common_1.CREDENTIALS.user1.wallet.walletAccountNo,
            },
            sourceAmount: Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000,
            sourceCurrency: common_1.CREDENTIALS.user3.wallet.currency,
            targetCurrency: common_1.CREDENTIALS.user1.wallet.currency,
            saveBeneficiary: false,
            token: common_1.CREDENTIALS.user3.token,
            createOtp: createOtp,
        },
    ];
};
const startUp = (createOtp) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, common_1.delay)(10000);
    const user1TokenResponse = yield (0, common_1.getLoginToken)(common_1.CREDENTIALS.user1.email, common_1.CREDENTIALS.user1.password);
    if (user1TokenResponse) {
        (0, common_1.updateCredentialProperty)(common_1.CREDENTIALS.user1.email, "token", user1TokenResponse.accessToken);
    }
    const user2TokenResponse = yield (0, common_1.getLoginToken)(common_1.CREDENTIALS.user2.email, common_1.CREDENTIALS.user2.password);
    if (user2TokenResponse) {
        (0, common_1.updateCredentialProperty)(common_1.CREDENTIALS.user2.email, "token", user2TokenResponse.accessToken);
    }
    const user3TokenResponse = yield (0, common_1.getLoginToken)(common_1.CREDENTIALS.user3.email, common_1.CREDENTIALS.user3.password);
    if (user3TokenResponse) {
        (0, common_1.updateCredentialProperty)(common_1.CREDENTIALS.user3.email, "token", user3TokenResponse.accessToken);
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
const getItemByProperty = (walletAccountNo) => {
    const foundItem = clonedTransferPayloads.find((item) => item.debitDetails.walletAccountNo === walletAccountNo);
    if (foundItem) {
        return foundItem;
    }
    else {
        return null;
    }
};
const transfersValid = (transferResponses) => __awaiter(void 0, void 0, void 0, function* () {
    for (let transferResponse of transferResponses) {
        if (!transferResponse.status) {
            return false;
        }
    }
    const user1TransferPayload = yield getItemByProperty(common_1.CREDENTIALS.user1.wallet.walletAccountNo);
    const user2TransferPayload = yield getItemByProperty(common_1.CREDENTIALS.user2.wallet.walletAccountNo);
    const user3TransferPayload = yield getItemByProperty(common_1.CREDENTIALS.user3.wallet.walletAccountNo);
    const user1WalletBalance = common_1.CREDENTIALS.user1.wallet.balance;
    const user2WalletBalance = common_1.CREDENTIALS.user2.wallet.balance;
    const user3WalletBalance = common_1.CREDENTIALS.user3.wallet.balance;
    if (!user1WalletBalance || !user2WalletBalance || !user3WalletBalance) {
        return false;
    }
    if (!user1TransferPayload || !user2TransferPayload || !user3TransferPayload) {
        return false;
    }
    const user1WalletDB = yield wallet_model_1.Wallet.findOne({
        walletAccountNo: common_1.CREDENTIALS.user1.wallet.walletAccountNo,
    });
    const user2WalletDB = yield wallet_model_1.Wallet.findOne({
        walletAccountNo: common_1.CREDENTIALS.user2.wallet.walletAccountNo,
    });
    const user3WalletDB = yield wallet_model_1.Wallet.findOne({
        walletAccountNo: common_1.CREDENTIALS.user3.wallet.walletAccountNo,
    });
    if (!user1WalletDB || !user2WalletDB || !user3WalletDB) {
        return false;
    }
    //User 1 expected balance after transfer to user2
    let user1ExpectedBalance = defaultBalance - user1TransferPayload.sourceAmount;
    user1ExpectedBalance =
        user1ExpectedBalance +
            user3TransferPayload.sourceAmount * (0, common_1.exchangeRate)(user3TransferPayload);
    //User 2 expected balance after user1 transfer
    let user2ExpectedBalance = defaultBalance +
        user1TransferPayload.sourceAmount * (0, common_1.exchangeRate)(user1TransferPayload);
    user2ExpectedBalance =
        user2ExpectedBalance - user2TransferPayload.sourceAmount;
    //User 3 expected balance after user2 transfer
    let user3ExpectedBalance = defaultBalance +
        user2TransferPayload.sourceAmount * (0, common_1.exchangeRate)(user2TransferPayload);
    user3ExpectedBalance =
        user3ExpectedBalance - user3TransferPayload.sourceAmount;
    const balances = {
        user1: [user1WalletDB.balance, user1ExpectedBalance],
        user2: [user2WalletDB.balance, user2ExpectedBalance],
        user3: [user3WalletDB.balance, user3ExpectedBalance],
    };
    logger_1.default.info(`Balances: ${JSON.stringify(balances, null, 2)}`);
    const roundTo2DP = (num) => Math.round(num * 100) / 100;
    if (roundTo2DP(user1WalletDB.balance) === roundTo2DP(user1ExpectedBalance) &&
        roundTo2DP(user2WalletDB.balance) === roundTo2DP(user2ExpectedBalance) &&
        roundTo2DP(user3WalletDB.balance) === roundTo2DP(user3ExpectedBalance)) {
        return true;
    }
    return false;
});
const ensureAllTransfersFailed = () => __awaiter(void 0, void 0, void 0, function* () {
    const user1WalletBalance = common_1.CREDENTIALS.user1.wallet.balance;
    const user2WalletBalance = common_1.CREDENTIALS.user2.wallet.balance;
    const user3WalletBalance = common_1.CREDENTIALS.user3.wallet.balance;
    if (!user1WalletBalance || !user2WalletBalance || !user3WalletBalance) {
        return false;
    }
    const user1WalletDB = yield wallet_model_1.Wallet.findOne({
        walletAccountNo: common_1.CREDENTIALS.user1.wallet.walletAccountNo,
    });
    const user2WalletDB = yield wallet_model_1.Wallet.findOne({
        walletAccountNo: common_1.CREDENTIALS.user2.wallet.walletAccountNo,
    });
    const user3WalletDB = yield wallet_model_1.Wallet.findOne({
        walletAccountNo: common_1.CREDENTIALS.user3.wallet.walletAccountNo,
    });
    if (user1WalletDB.balance == defaultBalance &&
        user2WalletDB.balance == defaultBalance &&
        user3WalletDB.balance == defaultBalance) {
        return true;
    }
    else {
        return false;
    }
});
describe("Load test transfer APIs", () => {
    it("users should not be able to make inter-wallet transfers without otp verification", () => __awaiter(void 0, void 0, void 0, function* () {
        process.env.TEST_ERROR = "false";
        const transferPromise = new Promise((resolve) => {
            transferEmitter.once("transferComplete", (transferResponses) => {
                resolve(transferResponses);
            });
        });
        yield startUp(false);
        const response = yield transferPromise;
        logger_1.default.info("Transfer Responses " + JSON.stringify(response, null, 2));
        const successPromise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(true); // Resolve promise when event is fired
            }, 6000);
        });
        yield successPromise;
        const transactionFailed = yield ensureAllTransfersFailed();
        expect(true).toEqual(transactionFailed);
    }));
    it("users should be able to make inter-wallet transfers with otp verification", () => __awaiter(void 0, void 0, void 0, function* () {
        // Add event listener
        process.env.TEST_ERROR = "false";
        const transferPromise = new Promise((resolve) => {
            transferEmitter.once("transferComplete", (transferResponses) => {
                resolve(transferResponses); // Resolve promise when event is fired
            });
        });
        yield startUp(true);
        const response = yield transferPromise;
        logger_1.default.info("Transfer Responses " + JSON.stringify(response, null, 2));
        const successPromise = new Promise((resolve) => {
            setTimeout(() => {
                resolve(true); // Resolve promise when event is fired
            }, 6000);
        });
        yield successPromise;
        const transactionSuccess = yield transfersValid(response);
        expect(true).toEqual(transactionSuccess);
    }));
});
