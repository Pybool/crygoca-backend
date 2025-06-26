"use strict";
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
const getLoginToken = async (email, password) => {
    const account = await accounts_model_1.default.findOne({ email: email });
    if (!account) {
        return null;
    }
    const isMatch = await account.isValidPassword(password);
    if (!isMatch)
        return null;
    const accessToken = await jwt_helper_1.default.signAccessToken(account.id);
    const refreshToken = await jwt_helper_1.default.signRefreshToken(account.id);
    return { status: true, data: account, accessToken, refreshToken };
};
exports.getLoginToken = getLoginToken;
const makeTransfer = async (transferPayloads) => {
    const responses = await Promise.all(transferPayloads.map(async (payload) => {
        if (payload.createOtp) {
            await (0, exports.sendTransferOtp)(payload.token, {
                walletToDebit: payload.debitDetails.walletAccountNo,
                walletToCredit: payload.creditDetails.walletAccountNo,
            });
            payload.otp = "1234";
        }
        logger_1.default.info(`OTP payload ${JSON.stringify({
            walletToDebit: payload.debitDetails.walletAccountNo,
            walletToCredit: payload.creditDetails.walletAccountNo,
        }, null, 2)}`);
        await (0, exports.delay)(2000);
        return await (0, exports.sendTransferRequest)(payload);
    }));
    return responses;
};
exports.makeTransfer = makeTransfer;
const sendTransferOtp = async (token, payload) => {
    try {
        const response = await fetch(`${exports.serverUrl}/api/v1/wallet/send-transfer-otp`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        logger_1.default.info(`Transfer OTP Send Response ${JSON.stringify(data, null, 2)}`);
        return data;
    }
    catch (error) {
        logger_1.default.error("Otp send failed:" + error.toString());
    }
};
exports.sendTransferOtp = sendTransferOtp;
const sendTransferRequest = async (payload) => {
    try {
        const response = await fetch(`${exports.serverUrl}/api/v1/wallet/transfer-to-wallet`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${payload.token}`,
            },
            body: JSON.stringify(payload),
        });
        const data = await response.json();
        logger_1.default.info("Transfer response:" + JSON.stringify(data, null, 2));
        return data;
    }
    catch (error) {
        logger_1.default.error("Transfer failed:" + error.toString());
    }
};
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
    }
};
exports.updateCredentialProperty = updateCredentialProperty;
const createWallets = async (email) => {
    const account = await accounts_model_1.default.findOne({ email: email });
    if (!account) {
        return {
            status: false,
            message: "No account found for user",
        };
    }
    if (!account?.geoData?.currency?.code) {
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
    const wallet = await wallet_model_1.Wallet.create({
        user: account._id,
        walletAccountNo,
        balance: defaultBalance,
        currency: account.geoData.currency.code,
        currencySymbol: account.geoData.currency.symbol,
    });
    if (wallet) {
        account.walletCreated = true;
        await account.save();
        (0, exports.updateCredentialProperty)(email, "wallet", wallet);
    }
    return {
        status: true,
        message: "Wallet created successfully.",
        wallet: wallet,
    };
};
exports.createWallets = createWallets;
