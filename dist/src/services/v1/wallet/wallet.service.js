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
exports.WalletService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const wallet_transaction_model_1 = require("../../../models/wallet-transaction.model");
const wallet_model_1 = require("../../../models/wallet.model");
const accounts_model_1 = __importDefault(require("../../../models/accounts.model"));
const notifications_model_1 = require("../../../models/notifications.model");
const wallet_beneficiaries_model_1 = require("../../../models/wallet-beneficiaries.model");
const wallet_notifications_service_1 = require("./wallet-notifications.service");
const transfers_handlers_1 = require("./transfers.handlers");
const helpers_1 = require("../helpers");
const withdrawals_model_1 = __importDefault(require("../../../models/withdrawals.model"));
const withdrawals_status_queue_1 = require("./withdrawals-status.queue");
const transfers_queue_1 = require("../tasks/wallet/transfers.queue");
class WalletService {
    static generateRandomAccountNumber() {
        const prefix = "CW-";
        const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000); // Generate 10 random digits
        return `${prefix}${randomDigits}`;
    }
    static generateUniqueAccountNumber() {
        return __awaiter(this, void 0, void 0, function* () {
            let unique = false;
            let accountNumber;
            while (!unique) {
                accountNumber = WalletService.generateRandomAccountNumber();
                const existingAccount = yield wallet_model_1.Wallet.findOne({ accountNumber });
                if (!existingAccount) {
                    unique = true; // Exit the loop if the account number is unique
                }
            }
            return accountNumber;
        });
    }
    static createWallet(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const account = yield accounts_model_1.default.findOne({ _id: userId });
            if (!account) {
                return null;
            }
            if (account.walletCreated) {
                return null;
            }
            if (!((_b = (_a = account === null || account === void 0 ? void 0 : account.geoData) === null || _a === void 0 ? void 0 : _a.currency) === null || _b === void 0 ? void 0 : _b.code)) {
                return null;
            }
            const walletAccountNo = yield WalletService.generateUniqueAccountNumber();
            if (!walletAccountNo) {
                return null;
            }
            const wallet = yield wallet_model_1.Wallet.create({
                user: account._id,
                walletAccountNo,
                currency: account.geoData.currency.code,
                currencySymbol: account.geoData.currency.symbol,
            });
            if (wallet) {
                account.walletCreated = true;
                yield account.save();
            }
            return wallet;
        });
    }
    static getWallet(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const wallet = yield wallet_model_1.Wallet.findOne({ user: userId });
                if (!wallet) {
                    return {
                        status: false,
                        message: "No wallet for found for user",
                    };
                }
                return {
                    status: true,
                    data: wallet,
                    message: "Wallet for user was successfully retrieved",
                };
            }
            catch (error) {
                throw error;
            }
        });
    }
    static getReceipientWallet(walletId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const wallet = yield wallet_model_1.Wallet.findOne({
                    walletAccountNo: walletId,
                }).populate("user");
                return wallet;
            }
            catch (error) {
                throw error;
            }
        });
    }
    static updateWalletBalance(type, amount, meta, //For Payout topup and direct topups
    debitDetails, creditDetails, saveBeneficiary) {
        return __awaiter(this, void 0, void 0, function* () {
            if (type === "wallet-transfer") {
                return yield WalletService.walletTransfer(type, amount, debitDetails, creditDetails, saveBeneficiary);
            }
            else if (type === "payout-topup") {
                return yield WalletService.walletPayoutTopUp(type, amount, meta);
            }
            else if (type === "direct-topup") {
                return yield WalletService.walletDirectTopUp(type, amount, meta);
            }
            else if (type === "wallet-withdrawal") {
                return yield WalletService.walletWithdrawal(type, amount, meta);
            }
        });
    }
    static validateTransfer(senderWalletAccountNo, receiverWalletAccountNo, currency, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            // Debit operation: Decrease balance for sender
            const senderWallet = yield wallet_model_1.Wallet.findOne({
                walletAccountNo: senderWalletAccountNo,
            });
            const receiverWallet = yield wallet_model_1.Wallet.findOne({
                walletAccountNo: receiverWalletAccountNo,
            });
            console.log(senderWalletAccountNo, currency, amount, senderWallet);
            if (!senderWallet) {
                throw new Error("Sender has no wallet");
            }
            if (!receiverWallet) {
                throw new Error("Receipient has no wallet");
            }
            if (currency !== senderWallet.currency) {
                throw new Error("Invalid currency for sender's wallet");
            }
            if (senderWallet.balance < amount) {
                throw new Error("Insufficient balance in sender's wallet");
            }
            return senderWallet;
        });
    }
    static walletTransfer(type, amount, debitDetails, creditDetails, saveBeneficiary) {
        return __awaiter(this, void 0, void 0, function* () {
            let rollbackActions = []; // To store rollback operations
            let senderWalletTransaction = null;
            let receiverWalletTransaction = null;
            let senderNotification = null;
            let receiverNotification = null;
            try {
                const senderWalletAccountNo = debitDetails.walletAccountNo;
                const receiverWalletAccountNo = creditDetails.walletAccountNo;
                const senderWalletCurrency = debitDetails.currency;
                const reference = (0, helpers_1.generateReferenceCode)("CWT-");
                const validatedSenderWallet = yield WalletService.validateTransfer(senderWalletAccountNo, receiverWalletAccountNo, senderWalletCurrency, debitDetails.amount);
                if (!validatedSenderWallet) {
                    throw new Error("Tranfer details could not be verified");
                }
                // Debit operation: Decrease balance for sender
                const senderWallet = yield wallet_model_1.Wallet.findOneAndUpdate({ walletAccountNo: senderWalletAccountNo }, { $inc: { balance: -1 * debitDetails.amount } }, { new: true } // Return the updated document
                );
                if (!senderWallet) {
                    throw new Error("Sender has no wallet");
                }
                if (senderWallet.balance < debitDetails.amount) {
                    throw new Error("Insufficient balance in sender's wallet");
                }
                else {
                    senderWalletTransaction = yield wallet_transaction_model_1.WalletTransaction.create({
                        user: senderWallet.user,
                        creditWalletAccountNo: receiverWalletAccountNo,
                        debitWalletAccountNo: senderWalletAccountNo,
                        amount: debitDetails.amount,
                        type: type,
                        operationType: "debit",
                        reference: reference
                    });
                    yield senderWalletTransaction.populate("user", "_id firstname lastname username email geoData");
                    senderNotification =
                        yield wallet_notifications_service_1.WalletNotificationService.createDebitNotification(senderWalletTransaction);
                }
                // Add rollback for debit (re-add the amount if something goes wrong later)
                rollbackActions.push(() => wallet_model_1.Wallet.updateOne({ walletAccountNo: senderWalletAccountNo }, { $inc: { balance: debitDetails.amount } }));
                rollbackActions.push(() => wallet_transaction_model_1.WalletTransaction.deleteOne({
                    _id: senderWalletTransaction._id,
                }));
                rollbackActions.push(() => notifications_model_1.NotificationModel.deleteOne({
                    _id: senderNotification._id,
                }));
                rollbackActions.push(() => wallet_notifications_service_1.WalletNotificationService.createCreditNotification(senderWalletTransaction, true));
                // Credit operation: Increase balance for receiver
                const receiverWallet = yield wallet_model_1.Wallet.findOneAndUpdate({ walletAccountNo: receiverWalletAccountNo }, { $inc: { balance: creditDetails.amount } }, { new: true });
                if (!receiverWallet) {
                    throw new Error("Receiver wallet not found");
                }
                else {
                    receiverWalletTransaction = yield wallet_transaction_model_1.WalletTransaction.create({
                        user: receiverWallet.user,
                        creditWalletAccountNo: receiverWalletAccountNo,
                        debitWalletAccountNo: senderWalletAccountNo,
                        amount: creditDetails.amount,
                        type: type,
                        operationType: "credit",
                        reference: reference
                    });
                    receiverWalletTransaction = yield receiverWalletTransaction.populate("user", "_id firstname lastname username email geoData");
                    receiverNotification =
                        yield wallet_notifications_service_1.WalletNotificationService.createCreditNotification(receiverWalletTransaction);
                }
                // Add rollback for credit (subtract the amount if something goes wrong later)
                rollbackActions.push(() => wallet_model_1.Wallet.updateOne({ walletAccountNo: receiverWalletAccountNo }, { $inc: { balance: -1 * creditDetails.amount } }));
                rollbackActions.push(() => wallet_transaction_model_1.WalletTransaction.deleteOne({
                    _id: receiverWalletTransaction._id,
                }));
                rollbackActions.push(() => notifications_model_1.NotificationModel.deleteOne({
                    _id: receiverNotification._id,
                }));
                rollbackActions.push(() => wallet_notifications_service_1.WalletNotificationService.createDebitNotification(receiverWalletTransaction, true));
                if (saveBeneficiary) {
                    const beneficiaryData = {
                        account: senderWallet.user,
                        beneficiaryAccount: receiverWallet.user,
                        receiverWallet: receiverWallet,
                    };
                    const beneficiary = yield wallet_beneficiaries_model_1.WalletBeneficiary.findOne({
                        account: senderWallet.user,
                        beneficiaryAccount: receiverWallet.user,
                    });
                    if (!beneficiary) {
                        yield wallet_beneficiaries_model_1.WalletBeneficiary.create(beneficiaryData);
                    }
                }
                console.log("Wallet operations completed successfully.");
            }
            catch (error) {
                console.error("Error occurred:", error.message);
                // Perform rollback actions
                for (const rollback of rollbackActions) {
                    try {
                        yield rollback(); // Execute each rollback operation
                    }
                    catch (rollbackError) {
                        console.error("Rollback failed:", rollbackError.message);
                    }
                }
                console.error("All operations were rolled back.");
            }
        });
    }
    static walletPayoutTopUp(type, amount, meta) {
        return __awaiter(this, void 0, void 0, function* () {
            let rollbackActions = []; // To store rollback operations
            let walletTransaction = null;
            let walletNotification = null;
            const reference = (0, helpers_1.generateReferenceCode)("CWP-");
            try {
                const positiveAmount = Math.abs(amount);
                let operation = { $inc: { balance: -1 * positiveAmount } }; // Debit Operation
                if (meta.operationType === "credit") {
                    operation = { $inc: { balance: positiveAmount } }; // Credit Operation
                }
                const wallet = yield wallet_model_1.Wallet.findOneAndUpdate({ walletAccountNo: meta.walletAccountNo }, operation, { new: true } // Return the updated document
                );
                if (!wallet) {
                    throw new Error("No wallet was fund for account number.");
                }
                if (wallet) {
                    walletTransaction = yield wallet_transaction_model_1.WalletTransaction.create({
                        user: wallet.user,
                        payout: meta.payoutId,
                        amount: positiveAmount,
                        type: type,
                        operationType: meta.operationType,
                        reference: reference
                    });
                }
                if (walletTransaction === null || walletTransaction === void 0 ? void 0 : walletTransaction.payout) {
                    walletTransaction = yield walletTransaction.populate({
                        path: "payout",
                        model: "Payout", // Ensure the model name matches
                        populate: {
                            path: "cryptoListingPurchase",
                            model: "cryptolistingpurchase",
                            populate: {
                                path: "cryptoListing",
                                model: "cryptolisting",
                                populate: {
                                    path: "cryptoCurrency",
                                    model: "cryptocurrencies",
                                },
                            },
                        },
                    });
                }
                walletTransaction = yield walletTransaction.populate("user", "_id firstname lastname username email geoData");
                // Add rollback for debit (re-add the amount if something goes wrong later)
                let inverseOperation = { $inc: { balance: positiveAmount } };
                if (meta.operationType === "credit") {
                    inverseOperation = { $inc: { balance: -1 * positiveAmount } }; // Debit Operation
                    walletNotification =
                        yield wallet_notifications_service_1.WalletNotificationService.createCreditNotification(walletTransaction);
                }
                rollbackActions.push(() => __awaiter(this, void 0, void 0, function* () {
                    yield wallet_model_1.Wallet.findOneAndUpdate({ walletAccountNo: meta.walletAccountNo }, inverseOperation, { new: true });
                }));
                rollbackActions.push(() => wallet_transaction_model_1.WalletTransaction.deleteOne({
                    _id: walletTransaction._id,
                }));
                rollbackActions.push(() => __awaiter(this, void 0, void 0, function* () {
                    notifications_model_1.NotificationModel.deleteOne({
                        _id: walletNotification._id,
                    });
                    walletNotification =
                        yield wallet_notifications_service_1.WalletNotificationService.createDebitNotification(walletTransaction);
                }));
                // throw new Error("Error for testing rollback");
                console.log("Wallet operations completed successfully.");
            }
            catch (error) {
                console.error("Error occurred:", error.message);
                // Perform rollback actions
                for (const rollback of rollbackActions) {
                    try {
                        yield rollback(); // Execute each rollback operation
                    }
                    catch (rollbackError) {
                        console.error("Rollback failed:", rollbackError.message);
                    }
                }
                console.error("All operations were rolled back.");
            }
        });
    }
    static walletDirectTopUp(type, amount, meta) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    static walletGetBeneficiaries(req) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let wallet = null;
                const page = parseInt(req.query.page, 10) || 1;
                const limit = parseInt(req.query.limit, 10) || 10;
                const skip = (page - 1) * limit;
                const accountId = req.accountId;
                const query = { account: accountId };
                const walletResponse = yield WalletService.getWallet(new mongoose_1.default.Types.ObjectId(accountId));
                if (walletResponse.status) {
                    wallet = walletResponse.data;
                }
                const beneficiaries = yield wallet_beneficiaries_model_1.WalletBeneficiary.find(query)
                    .skip(skip)
                    .limit(limit)
                    .sort({ createdAt: -1 })
                    .populate({
                    path: "receiverWallet",
                    model: "Wallet", // Ensure the model name matches
                    populate: {
                        path: "user",
                        model: "accounts",
                    },
                })
                    .exec();
                // Count total documents for pagination metadata
                const totalDocuments = yield wallet_beneficiaries_model_1.WalletBeneficiary.countDocuments(query);
                // Build the response with pagination metadata
                const response = {
                    beneficiaries,
                    wallet,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(totalDocuments / limit),
                        totalDocuments,
                    },
                };
                return response;
            }
            catch (error) {
                throw error;
            }
        });
    }
    static walletWithdrawal(type, amount, meta) {
        return __awaiter(this, void 0, void 0, function* () {
            let rollbackActions = []; // To store rollback operations
            let walletTransaction = null;
            let walletNotification = null;
            const reference = (0, helpers_1.generateReferenceCode)("CWW-");
            try {
                const positiveAmount = Math.abs(amount);
                let operation = { $inc: { balance: positiveAmount } }; // Credit Operation
                if (meta.operationType === "debit") {
                    operation = { $inc: { balance: -1 * positiveAmount } }; // Debit Operation
                }
                const wallet = yield wallet_model_1.Wallet.findOneAndUpdate({ walletAccountNo: meta.walletAccountNo }, operation, { new: true } // Return the updated document
                );
                if (!wallet) {
                    throw new Error("No wallet was fund for account number.");
                }
                if (meta.operationType === "debit") {
                    if (wallet.balance < positiveAmount) {
                        throw new Error("Insufficient balance in wallet");
                    }
                }
                if (wallet) {
                    walletTransaction = yield wallet_transaction_model_1.WalletTransaction.create({
                        user: wallet.user,
                        amount: positiveAmount,
                        type: type,
                        operationType: meta.operationType,
                        reference: reference
                    });
                }
                walletTransaction = yield walletTransaction.populate("user", "_id firstname lastname username email geoData");
                // Add rollback for debit (re-add the amount if something goes wrong later)
                let inverseOperation = { $inc: { balance: -1 * positiveAmount } };
                if (meta.operationType === "debit") {
                    inverseOperation = { $inc: { balance: positiveAmount } }; // Credit Operation
                    walletNotification =
                        yield wallet_notifications_service_1.WalletNotificationService.createDebitNotification(walletTransaction);
                }
                rollbackActions.push(() => __awaiter(this, void 0, void 0, function* () {
                    yield wallet_model_1.Wallet.findOneAndUpdate({ walletAccountNo: meta.walletAccountNo }, inverseOperation, { new: true });
                }));
                rollbackActions.push(() => wallet_transaction_model_1.WalletTransaction.deleteOne({
                    _id: walletTransaction._id,
                }));
                rollbackActions.push(() => __awaiter(this, void 0, void 0, function* () {
                    notifications_model_1.NotificationModel.deleteOne({
                        _id: walletNotification._id,
                    });
                    walletNotification =
                        yield wallet_notifications_service_1.WalletNotificationService.createCreditNotification(walletTransaction);
                }));
                // throw new Error("Error for testing rollback");
                console.log("Wallet operations completed successfully.");
            }
            catch (error) {
                console.error("Error occurred:", error.message);
                // Perform rollback actions
                for (const rollback of rollbackActions) {
                    try {
                        yield rollback(); // Execute each rollback operation
                    }
                    catch (rollbackError) {
                        console.error("Rollback failed:", rollbackError.message);
                    }
                }
                console.error("All operations were rolled back.");
            }
        });
    }
    static processToLocalBankWithdrawal(type, data, hash, accountId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (type !== "wallet-to-bank-withdrawal") {
                    throw new Error("Invalid request and operation type");
                }
                const senderWallet = yield wallet_model_1.Wallet.findOne({
                    user: accountId,
                });
                if (!senderWallet) {
                    throw new Error("Sender has no wallet");
                }
                if (senderWallet.balance < data.amount) {
                    throw new Error("Insufficient balance in wallet");
                }
                data.reference = (0, helpers_1.generateReferenceCode)("BW-");
                console.log("Complete Withdrawal data =-==> ", data);
                const withdrawalResponse = yield (0, transfers_handlers_1.withdrawToLocalBankHandler)(data);
                console.log("WithdrawalResponse ==> ", withdrawalResponse);
                const withdrawal = yield withdrawals_model_1.default.create({
                    wallet: senderWallet._id,
                    account: new mongoose_1.default.Types.ObjectId(accountId),
                    status: withdrawalResponse.data.status,
                    hash: hash,
                    reference: data.reference,
                    payload: data,
                    queuedResponse: withdrawalResponse,
                });
                if (withdrawal.status === "NEW") {
                    const withdrawalStatusQueue = new withdrawals_status_queue_1.WithdrawalStatusQueue();
                    yield withdrawalStatusQueue.enqueue(withdrawal);
                    //Debit customer's wallet
                    yield (0, transfers_queue_1.addWalletBalanceUpdateJob)("wallet-withdrawal", withdrawalResponse.data.amount, {
                        operationType: "debit",
                        walletAccountNo: senderWallet.walletAccountNo,
                    });
                }
            }
            catch (error) {
                console.log("Withdrawal error ", error === null || error === void 0 ? void 0 : error.message);
            }
        });
    }
    static updateWithdrawalStatus(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const withdrawal = yield withdrawals_model_1.default.findOne({
                    _id: data.initialPayload._id,
                });
                if (withdrawal) {
                    withdrawal.status = "SUCCESS";
                    withdrawal.verificationResponse = data.transferRespponse;
                    yield withdrawal.save();
                }
            }
            catch (error) { }
        });
    }
}
exports.WalletService = WalletService;
// button.Button.Button_sm.APIRequest-example-button1DGMsfaOTVNW {
//   background: whitesmoke;
//   color: black;
//   flex-direction: column;
//   width: max-content;
// }
