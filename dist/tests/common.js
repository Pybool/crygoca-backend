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
exports.createWallets = exports.updateCredentialProperty = exports.getCredentialByProperty = exports.sendTransferRequest = exports.sendTransferOtp = exports.makeTransfer = exports.getLoginToken = exports.getRandomUserPair = exports.CREDENTIALS = exports.serverUrl = exports.exchangeRate = exports.delay = void 0;
const jwt_helper_1 = __importDefault(require("../src/helpers/jwt_helper"));
const accounts_model_1 = __importDefault(require("../src/models/accounts.model"));
require("../src/bootstrap/init.mongo");
const logger_1 = __importDefault(require("../src/bootstrap/logger"));
const wallet_model_1 = require("../src/models/wallet.model");
const defaultBalance = 4000;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.delay = delay;
const exchangeRate = (userTransferPayload) => {
    if (userTransferPayload.sourceCurrency == "USD" &&
        userTransferPayload.targetCurrency == "GHS") {
        return 15.3;
    }
    if (userTransferPayload.sourceCurrency == "USD" &&
        userTransferPayload.targetCurrency == "ZAR") {
        return 18.5;
    }
    if (userTransferPayload.sourceCurrency == "ZAR" &&
        userTransferPayload.targetCurrency == "USD") {
        return 0.054;
    }
    if (userTransferPayload.sourceCurrency == "GHS" &&
        userTransferPayload.targetCurrency == "ZAR") {
        return 1.2;
    }
    return 1.0;
};
exports.exchangeRate = exchangeRate;
exports.serverUrl = process.env.CRYGOCA_SERVER_URL || "http://localhost:8000";
exports.CREDENTIALS = {
    user1: {
        email: "ekoemmanuelgodcoder@gmail.com",
        password: "@10111011qweQWE",
    },
    user2: {
        email: "ekoemmanueljavl@gmail.com",
        password: "@10111011qweQWE",
    },
    user3: {
        email: "maranbu@yahoo.com",
        password: "@10111011qweQWE",
    },
};
function getRandomUserPair() {
    const users = Object.values(exports.CREDENTIALS);
    if (users.length < 2) {
        throw new Error("At least two users are required for a transfer.");
    }
    let senderIndex = Math.floor(Math.random() * users.length);
    let recipientIndex;
    do {
        recipientIndex = Math.floor(Math.random() * users.length);
    } while (recipientIndex === senderIndex);
    return {
        sender: users[senderIndex],
        recipient: users[recipientIndex],
    };
}
exports.getRandomUserPair = getRandomUserPair;
const getLoginToken = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    const account = yield accounts_model_1.default.findOne({ email: email });
    if (!account) {
        return null;
    }
    const isMatch = yield account.isValidPassword(password);
    if (!isMatch)
        return null;
    const accessToken = yield jwt_helper_1.default.signAccessToken(account.id);
    const refreshToken = yield jwt_helper_1.default.signRefreshToken(account.id);
    return { status: true, data: account, accessToken, refreshToken };
});
exports.getLoginToken = getLoginToken;
const makeTransfer = (transferPayloads) => __awaiter(void 0, void 0, void 0, function* () {
    const responses = yield Promise.all(transferPayloads.map((payload) => __awaiter(void 0, void 0, void 0, function* () {
        if (payload.createOtp) {
            yield (0, exports.sendTransferOtp)(payload.token, {
                walletToDebit: payload.debitDetails.walletAccountNo,
                walletToCredit: payload.creditDetails.walletAccountNo,
            });
            payload.otp = "1234";
        }
        logger_1.default.info(`OTP payload ${JSON.stringify({
            walletToDebit: payload.debitDetails.walletAccountNo,
            walletToCredit: payload.creditDetails.walletAccountNo,
        }, null, 2)}`);
        yield (0, exports.delay)(2000);
        return yield (0, exports.sendTransferRequest)(payload);
    })));
    return responses;
});
exports.makeTransfer = makeTransfer;
const sendTransferOtp = (token, payload) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield fetch(`${exports.serverUrl}/api/v1/wallet/send-transfer-otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });
        const data = yield response.json();
        logger_1.default.info(`Transfer OTP Send Response ${JSON.stringify(data, null, 2)}`);
        return data;
    }
    catch (error) {
        logger_1.default.error("Otp send failed:" + error.toString());
    }
});
exports.sendTransferOtp = sendTransferOtp;
const sendTransferRequest = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield fetch(`${exports.serverUrl}/api/v1/wallet/transfer-to-wallet`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${payload.token}`,
            },
            body: JSON.stringify(payload),
        });
        const data = yield response.json();
        logger_1.default.info("Transfer response:" + JSON.stringify(data, null, 2));
        return data;
    }
    catch (error) {
        logger_1.default.error("Transfer failed:" + error.toString());
    }
});
exports.sendTransferRequest = sendTransferRequest;
const getCredentialByProperty = (email) => {
    const userKey = Object.keys(exports.CREDENTIALS).find((key) => exports.CREDENTIALS[key].email === email);
    if (userKey) {
        return exports.CREDENTIALS[userKey];
    }
    else {
        return null;
    }
};
exports.getCredentialByProperty = getCredentialByProperty;
const updateCredentialProperty = (email, property, value) => {
    const userKey = Object.keys(exports.CREDENTIALS).find((key) => exports.CREDENTIALS[key].email === email);
    if (userKey) {
        exports.CREDENTIALS[userKey][property] = value;
    }
    else {
        console.log(`No user found with email: ${email}`);
    }
};
exports.updateCredentialProperty = updateCredentialProperty;
const createWallets = (email) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const account = yield accounts_model_1.default.findOne({ email: email });
    if (!account) {
        return {
            status: false,
            message: "No account found for user",
        };
    }
    if (!((_b = (_a = account === null || account === void 0 ? void 0 : account.geoData) === null || _a === void 0 ? void 0 : _a.currency) === null || _b === void 0 ? void 0 : _b.code)) {
        return {
            status: false,
            message: "Failed to create your wallet, please ensure you have updated preferred currency in profile section or try again later!",
        };
    }
    const walletAccountNo = Date.now().toString();
    // await WalletService.generateUniqueAccountNumber(account)!;
    if (!walletAccountNo) {
        return {
            status: false,
            message: "Failed to generate an account number for wallet",
        };
    }
    const wallet = yield wallet_model_1.Wallet.create({
        user: account._id,
        walletAccountNo,
        balance: defaultBalance,
        currency: account.geoData.currency.code,
        currencySymbol: account.geoData.currency.symbol,
    });
    if (wallet) {
        account.walletCreated = true;
        yield account.save();
        (0, exports.updateCredentialProperty)(email, "wallet", wallet);
    }
    return {
        status: true,
        message: "Wallet created successfully.",
        wallet: wallet,
    };
});
exports.createWallets = createWallets;
