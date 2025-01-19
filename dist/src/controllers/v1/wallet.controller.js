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
exports.walletGetBeneficiaries = exports.verifyWithdrawalOtp = exports.sendWithdrawalOtp = exports.verifyTransferOtp = exports.sendTransferOtp = exports.getReceipientWallet = exports.processWalletToBankWithdrawals = exports.processWalletTransfer = exports.createWallet = void 0;
const transfers_queue_1 = require("../../services/v1/tasks/wallet/transfers.queue");
const wallet_service_1 = require("../../services/v1/wallet/wallet.service");
const comparison_service_1 = require("../../services/v1/conversions/comparison.service");
const countries_1 = require("../../models/countries");
const wallet_model_1 = require("../../models/wallet.model");
const accounts_model_1 = __importDefault(require("../../models/accounts.model"));
const wallet_authorizations_service_1 = require("../../services/v1/wallet/wallet-authorizations.service");
const createWallet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountId = req.accountId;
        const account = yield accounts_model_1.default.findOne({ _id: accountId });
        if (!account) {
            return res.status(400).json({
                status: false,
                message: "No account found for user",
            });
        }
        const wallet = yield wallet_service_1.WalletService.createWallet(account._id);
        if (!wallet) {
            return res.status(400).json({
                status: false,
                message: "Failed to create your wallet, please ensure you have updated preferred currency in profile section or try again later!",
            });
        }
        return res.status(200).json({
            status: true,
            message: "Wallet created successfully",
            data: wallet,
        });
    }
    catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
});
exports.createWallet = createWallet;
const processWalletTransfer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { debitDetails, creditDetails, sourceAmount, sourceCurrency, targetCurrency, saveBeneficiary, } = req.body;
    let amount = 0.0;
    try {
        const validatedSenderWallet = yield wallet_service_1.WalletService.validateTransfer(debitDetails.walletAccountNo, creditDetails.walletAccountNo, sourceCurrency, sourceAmount);
        if (!validatedSenderWallet) {
            return res.status(400).json({
                status: false,
                message: "Failed to validate transaction",
            });
        }
    }
    catch (error) {
        return res.status(400).json({
            status: false,
            message: error.message,
        });
    }
    if (sourceCurrency === targetCurrency) {
        amount = sourceAmount;
    }
    else {
        /* Convert source currency to target currency */
        const from = (0, countries_1.getCountryCodeByCurrencyCode)(sourceCurrency.toUpperCase()).code;
        const to = (0, countries_1.getCountryCodeByCurrencyCode)(targetCurrency.toUpperCase()).code;
        const convertToDefaultCurrency = (amount) => __awaiter(void 0, void 0, void 0, function* () {
            if (from && to && sourceCurrency && targetCurrency) {
                return yield (0, comparison_service_1.convertCurrency)(from, to, sourceCurrency, targetCurrency, amount === null || amount === void 0 ? void 0 : amount.toString());
            }
            return null;
        });
        const exchangeRateData = yield convertToDefaultCurrency(1);
        const exchangeRate = (_b = (_a = exchangeRateData === null || exchangeRateData === void 0 ? void 0 : exchangeRateData.data) === null || _a === void 0 ? void 0 : _a.data[targetCurrency.toUpperCase()]) === null || _b === void 0 ? void 0 : _b.value;
        if (!exchangeRate) {
            return res.status(422).json({
                status: false,
                message: "Currency conversion failed, please try again later!",
            });
        }
        amount = sourceAmount * exchangeRate;
        creditDetails.amount = amount; //Converted Amount
        creditDetails.currency = targetCurrency;
        debitDetails.amount = sourceAmount; // Source/Raw amount
        debitDetails.currency = sourceCurrency;
    }
    try {
        const meta = null;
        const transferId = `${debitDetails.accountNumber}-${creditDetails.accountNumber}`;
        yield (0, transfers_queue_1.addWalletBalanceUpdateJob)("wallet-transfer", amount, meta, transferId, debitDetails, creditDetails, saveBeneficiary);
        res
            .status(200)
            .json({ status: true, message: "Transaction queued successfully" });
    }
    catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
});
exports.processWalletTransfer = processWalletTransfer;
const processWalletToBankWithdrawals = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { data, hash } = req.body;
        const accountId = req.accountId;
        const hashIsSame = wallet_authorizations_service_1.WalletAuthorization.comparePayloadHashes(hash, data);
        const senderWallet = yield wallet_model_1.Wallet.findOne({
            user: accountId,
        });
        if (!senderWallet) {
            throw new Error("Sender has no wallet");
        }
        if (senderWallet.balance < data.amount) {
            throw new Error("Insufficient balance in wallet");
        }
        if (!hashIsSame) {
            return res
                .status(200)
                .json({
                status: false,
                message: "Non-matching/Invalid withdrawal request hash",
            });
        }
        const authorizationResponse = yield wallet_authorizations_service_1.WalletAuthorization.getWithdrawalAuthorization(accountId, hash);
        if (authorizationResponse === null || authorizationResponse === void 0 ? void 0 : authorizationResponse.status) {
            yield (0, transfers_queue_1.addWalletWithdrawalJob)("wallet-to-bank-withdrawal", data, hash, accountId);
            return res
                .status(200)
                .json({ status: true, message: "Withdrawal request is processing" });
        }
        else {
            return res.status(422).json(authorizationResponse);
        }
    }
    catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
});
exports.processWalletToBankWithdrawals = processWalletToBankWithdrawals;
const getReceipientWallet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const walletId = req.query.walletId;
        const wallet = yield wallet_service_1.WalletService.getReceipientWallet(walletId);
        if (!wallet) {
            return res.status(200).json({
                status: false,
                message: "Failed to retrieve receipient wallet!",
            });
        }
        return res.status(200).json({
            status: true,
            message: "Wallet fetched successfully",
            data: wallet,
        });
    }
    catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
});
exports.getReceipientWallet = getReceipientWallet;
const sendTransferOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transferIntent = req.body;
        const response = yield wallet_authorizations_service_1.WalletAuthorization.sendTransferOtp(transferIntent);
        return res.status(200).json(response);
    }
    catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
});
exports.sendTransferOtp = sendTransferOtp;
const verifyTransferOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transferIntentWithCode = req.body;
        const response = yield wallet_authorizations_service_1.WalletAuthorization.verifyTransferOtp(transferIntentWithCode);
        if (response) {
            return res.status(200).json(response);
        }
        throw new Error("Failed to verify transfer authorization");
    }
    catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
});
exports.verifyTransferOtp = verifyTransferOtp;
const sendWithdrawalOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payloadHash = req.body.payloadHash;
        const accountId = req.accountId;
        const response = yield wallet_authorizations_service_1.WalletAuthorization.sendWithdrawalOtp(accountId, payloadHash);
        return res.status(200).json(response);
    }
    catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
});
exports.sendWithdrawalOtp = sendWithdrawalOtp;
const verifyWithdrawalOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountId = req.accountId;
        const withdrawalIntent = req.body;
        withdrawalIntent.accountId = accountId;
        const response = yield wallet_authorizations_service_1.WalletAuthorization.verifyWithdrawalOtp(withdrawalIntent);
        if (response) {
            return res.status(200).json(response);
        }
        throw new Error("Failed to verify transfer authorization");
    }
    catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
});
exports.verifyWithdrawalOtp = verifyWithdrawalOtp;
const walletGetBeneficiaries = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield wallet_service_1.WalletService.walletGetBeneficiaries(req);
        if (data) {
            return res.status(200).json({
                status: true,
                message: "Beneficiaries fetched successfully.",
                data: data,
            });
        }
        throw new Error("Failed to fetch beneficiaries.");
    }
    catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
});
exports.walletGetBeneficiaries = walletGetBeneficiaries;
