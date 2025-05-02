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
exports.externalPaymentProcessing = exports.makeExternalPayment = exports.payWithWalletBalance = exports.sendExternalWalletPaymentAuthorizationPin = exports.sendWalletPaymentAuthorizationPin = exports.cardTopUpFundWallet = exports.walletGetBeneficiaries = exports.verifyWithdrawalOtp = exports.sendWithdrawalOtp = exports.verifyTransferOtp = exports.sendTransferOtp = exports.getReceipientWalletUid = exports.getReceipientWallet = exports.processWalletToBankWithdrawals = exports.processWalletTransfer = exports.createWallet = void 0;
const transfers_queue_1 = require("../../services/v1/tasks/wallet/transfers.queue");
const wallet_service_1 = require("../../services/v1/wallet/wallet.service");
const comparison_service_1 = require("../../services/v1/conversions/comparison.service");
const countries_1 = require("../../models/countries");
const wallet_model_1 = require("../../models/wallet.model");
const accounts_model_1 = __importDefault(require("../../models/accounts.model"));
const wallet_authorizations_service_1 = require("../../services/v1/wallet/wallet-authorizations.service");
const wallet_funding_service_1 = require("../../services/v1/wallet/wallet-funding.service");
const mongoose_1 = __importDefault(require("mongoose"));
const makeTransfer = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { debitDetails, creditDetails, sourceAmount, sourceCurrency, targetCurrency, saveBeneficiary, otp, jobType, orderId, } = payload;
    let amount = 0.0;
    try {
        console.log("Transfer otp from test ", otp);
        if (jobType === "wallet-transfer") {
            const validatedSenderWallet = yield wallet_service_1.WalletService.validateTransfer(debitDetails.walletAccountNo, creditDetails.walletAccountNo, sourceCurrency, sourceAmount, otp);
            if (!validatedSenderWallet) {
                return {
                    status: false,
                    message: "Failed to validate transaction",
                    code: 400,
                };
            }
        }
    }
    catch (error) {
        return {
            status: false,
            message: error.message,
            code: 500,
        };
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
            return {
                status: false,
                message: "Currency conversion failed, please try again later!",
                code: 422,
            };
        }
        amount = sourceAmount * exchangeRate;
        creditDetails.amount = amount; //Converted Amount
        creditDetails.currency = targetCurrency;
        debitDetails.amount = sourceAmount; // Source/Raw amount
        debitDetails.currency = sourceCurrency;
        console.log("Conversion Data XXXX ========================> ", {
            convertedAMount: amount,
            rawAmount: sourceAmount,
            targetCurrency: creditDetails.currency,
            sourceCurrency
        });
    }
    debitDetails.otp = otp;
    try {
        let meta = null;
        if (jobType === "wallet-balance-payment") {
            meta = { checkOutId: orderId };
        }
        const transferId = `${debitDetails.accountNumber}-${creditDetails.accountNumber}`;
        yield (0, transfers_queue_1.addWalletBalanceUpdateJob)(jobType, amount, meta, transferId, debitDetails, creditDetails, saveBeneficiary);
        return {
            status: true,
            message: "Transaction queued successfully",
            code: 200,
        };
    }
    catch (error) {
        return { status: false, error: error.message, code: 500 };
    }
});
const processExternalPayment = (payload, externalWalletTransaction) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { merchantCredentials } = payload;
        const merchantWallet = yield wallet_model_1.Wallet.findOne({
            user: merchantCredentials.account,
        }).populate({
            path: "user",
            model: "merchantAccounts",
        });
        if (!merchantWallet) {
            return { status: false, message: "No wallet found for merchant" };
        }
        const jobType = "external-wallet-balance-payment";
        const meta = { checkOutId: externalWalletTransaction.txRef };
        const amount = externalWalletTransaction.isConverted
            ? externalWalletTransaction.convertedAmount
            : externalWalletTransaction.amount;
        const debitDetails = {
            walletAccountNo: externalWalletTransaction.debitWallet.walletAccountNo,
            currency: externalWalletTransaction.debitWallet.currency,
            amount,
        };
        const creditDetails = {
            walletAccountNo: externalWalletTransaction.creditWallet.walletAccountNo,
            currency: externalWalletTransaction.creditWallet.currency,
            amount,
        };
        const transferId = `${debitDetails.walletAccountNo}-${creditDetails.walletAccountNo}`;
        yield (0, transfers_queue_1.addWalletBalanceUpdateJob)(jobType, amount, meta, transferId, debitDetails, creditDetails, false);
        return {
            status: true,
            message: "Transaction queued successfully",
            code: 200,
        };
    }
    catch (error) {
        return { status: false, error: error.message, code: 500 };
    }
});
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
        const walletResponse = yield wallet_service_1.WalletService.createWallet(account._id);
        if (!walletResponse.status) {
            return res.status(400).json(walletResponse);
        }
        return res.status(200).json({
            status: true,
            message: "Wallet created successfully",
            data: walletResponse.data,
        });
    }
    catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
});
exports.createWallet = createWallet;
const processWalletTransfer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.body;
    payload.jobType = "wallet-transfer";
    const response = yield makeTransfer(payload);
    return res.status((response === null || response === void 0 ? void 0 : response.code) || 200).json(response);
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
            return res.status(200).json({
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
    var _c;
    try {
        const walletId = req.query.walletId;
        const accountId = req.accountId;
        const isTransferStr = (_c = req.query) === null || _c === void 0 ? void 0 : _c.isTransfer;
        let isTransfer = true;
        if (isTransferStr && isTransferStr === "0") {
            isTransfer = false;
        }
        const walletResponse = yield wallet_service_1.WalletService.getReceipientWallet(walletId, accountId, isTransfer);
        return res.status(200).json(walletResponse);
    }
    catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
});
exports.getReceipientWallet = getReceipientWallet;
const getReceipientWalletUid = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accountId = req.query.accountId;
        const walletResponse = yield wallet_service_1.WalletService.getWallet(new mongoose_1.default.Types.ObjectId(accountId));
        return res.status(200).json(walletResponse);
    }
    catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
});
exports.getReceipientWalletUid = getReceipientWalletUid;
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
const cardTopUpFundWallet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield wallet_funding_service_1.WalletFundingService.cardTopUpFundWallet(req);
        if (response) {
            return res.status(200).json(response);
        }
        throw new Error("Failed to fund wallet");
    }
    catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
});
exports.cardTopUpFundWallet = cardTopUpFundWallet;
const sendWalletPaymentAuthorizationPin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payloadHash = req.body.payloadHash;
        const checkOutId = req.body.checkOutId;
        const accountId = req.accountId || req.body.accountId;
        const response = yield wallet_authorizations_service_1.WalletAuthorization.sendWalletPaymentAuthorizationPin(accountId, payloadHash, checkOutId);
        return res.status(200).json(response);
    }
    catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
});
exports.sendWalletPaymentAuthorizationPin = sendWalletPaymentAuthorizationPin;
const sendExternalWalletPaymentAuthorizationPin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payload = req.body;
        payload.merchantCredentials = req.merchantCredentials;
        const response = yield wallet_authorizations_service_1.WalletAuthorization.sendExternalWalletPaymentAuthorizationPin(payload);
        return res.status(200).json(response);
    }
    catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
});
exports.sendExternalWalletPaymentAuthorizationPin = sendExternalWalletPaymentAuthorizationPin;
const payWithWalletBalance = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const paymentHash = req.body.paymentHash;
        const checkOutId = req.body.orderId;
        const amount = req.body.amount;
        const authorizationPin = req.body.authorizationPin.toString();
        const accountId = req.accountId || req.body.accountId;
        console.log("Pay with balance payload ===> ", JSON.stringify(req.body, null, 2));
        let response = yield wallet_authorizations_service_1.WalletAuthorization.validateWalletPaymentAuthorizationPin(accountId, paymentHash, authorizationPin, checkOutId);
        if (response.status) {
            const wallet = yield wallet_model_1.Wallet.findOne({ user: accountId });
            if (!wallet) {
                throw new Error("No wallet found to debit for request.");
            }
            const payload = req.body;
            payload.otp = payload.authorizationPin;
            payload.jobType = "wallet-balance-payment";
            const response = yield makeTransfer(payload);
            return res.status((response === null || response === void 0 ? void 0 : response.code) || 200).json(response);
        }
        return res.status(200).json(response);
    }
    catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
});
exports.payWithWalletBalance = payWithWalletBalance;
//Example Merchant intergration of the crygoca-pay sdk
const makeExternalPayment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payload = req.body;
        const response = yield wallet_service_1.WalletService.makeExternalPayment(payload);
        return res
            .status((response === null || response === void 0 ? void 0 : response.code) || 200)
            .json((response === null || response === void 0 ? void 0 : response.data) || { status: false, message: "Operation failed" });
    }
    catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
});
exports.makeExternalPayment = makeExternalPayment;
//Handles integration of crygoca-pay sdk, called by above method.
const externalPaymentProcessing = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const paymentHash = req.body.paymentHash;
        const checkOutId = req.body.orderId;
        const amount = req.body.amount;
        const authorizationPin = req.body.authorizationPin.toString();
        const accountId = req.accountId || req.body.accountId;
        console.log("Pay with balance payload ===> ", JSON.stringify(req.body, null, 2));
        let response = yield wallet_authorizations_service_1.WalletAuthorization.validateExternalWalletPaymentAuthorizationPin(accountId, paymentHash, authorizationPin, checkOutId);
        if (response.status) {
            const wallet = yield wallet_model_1.Wallet.findOne({ user: accountId });
            if (!wallet) {
                throw new Error("No wallet found to debit for request.");
            }
            const payload = req.body;
            payload.otp = payload.authorizationPin;
            payload.jobType = "external-wallet-balance-payment";
            payload.merchantCredentials = req.merchantCredentials;
            const _response = (yield processExternalPayment(payload, response.data));
            if (_response) {
                _response.data = JSON.parse(JSON.stringify(response.data));
            }
            return res.status((_response === null || _response === void 0 ? void 0 : _response.code) || 200).json(_response);
        }
        return res.status(200).json(response);
    }
    catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
});
exports.externalPaymentProcessing = externalPaymentProcessing;
