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
const wallet_beneficiaries_model_1 = require("../../../models/wallet-beneficiaries.model");
const wallet_notifications_service_1 = require("./wallet-notifications.service");
const transfers_handlers_1 = require("./transfers.handlers");
const helpers_1 = require("../helpers");
const withdrawals_model_1 = __importDefault(require("../../../models/withdrawals.model"));
const withdrawals_status_queue_1 = require("./withdrawals-status.queue");
const transfers_queue_1 = require("../tasks/wallet/transfers.queue");
const wallet_failurehandler_service_1 = require("./wallet-failurehandler.service");
const crypto_1 = require("crypto");
const payouts_model_1 = __importDefault(require("../../../models/payouts.model"));
const wallet_authorizations_service_1 = require("./wallet-authorizations.service");
const logger_1 = __importDefault(require("../../../bootstrap/logger"));
const config_1 = require("../../../../config");
const rollback_service_1 = require("./rollback.service");
class WalletService {
    static generateRandomAccountNumber(account) {
        const areaCode = account.geoData.isoCode; // ISO Code (e.g., "180")
        const shortTimestamp = Math.floor(Date.now() / 1000); // Current timestamp in seconds
        const walletAccountNo = `${areaCode}${shortTimestamp}`;
        return walletAccountNo;
    }
    static generateUniqueAccountNumber(account) {
        return __awaiter(this, void 0, void 0, function* () {
            let unique = false;
            let accountNumber;
            while (!unique) {
                accountNumber = WalletService.generateRandomAccountNumber(account);
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
                return {
                    status: false,
                    message: "No account found for user",
                };
            }
            if (account.walletCreated) {
                return {
                    status: false,
                    message: "You already have an existing wallet.",
                };
            }
            if (!((_b = (_a = account === null || account === void 0 ? void 0 : account.geoData) === null || _a === void 0 ? void 0 : _a.currency) === null || _b === void 0 ? void 0 : _b.code)) {
                return {
                    status: false,
                    message: "Failed to create your wallet, please ensure you have updated preferred currency in profile section or try again later!",
                };
            }
            const walletAccountNo = yield WalletService.generateUniqueAccountNumber(account);
            if (!walletAccountNo) {
                return {
                    status: false,
                    message: "Failed to generate an account number for wallet",
                };
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
            return {
                status: true,
                message: "Wallet created successfully.",
                wallet: wallet,
            };
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
    static getReceipientWallet(walletId_1) {
        return __awaiter(this, arguments, void 0, function* (walletId, accountId = null) {
            try {
                let myWallet = null;
                if (accountId) {
                    myWallet = yield wallet_model_1.Wallet.findOne({
                        user: accountId,
                    });
                }
                if (myWallet && (myWallet === null || myWallet === void 0 ? void 0 : myWallet.walletAccountNo) == walletId) {
                    return {
                        status: false,
                        message: "You cannot make a transfer to your own wallet, you can only transfer to other crygoca wallets",
                    };
                }
                const wallet = yield wallet_model_1.Wallet.findOne({
                    walletAccountNo: walletId,
                }).populate("user");
                if (!wallet) {
                    return {
                        status: false,
                        message: "Failed to retrieve receipient wallet!",
                    };
                }
                return {
                    status: true,
                    message: "Recipient wallet retrieved successfully!",
                    wallet: wallet,
                };
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
    static validateTransfer(senderWalletAccountNo, receiverWalletAccountNo, currency, amount, otp) {
        return __awaiter(this, void 0, void 0, function* () {
            // Debit operation: Decrease balance for sender
            const senderWallet = yield wallet_model_1.Wallet.findOne({
                walletAccountNo: senderWalletAccountNo,
            });
            const receiverWallet = yield wallet_model_1.Wallet.findOne({
                walletAccountNo: receiverWalletAccountNo,
            });
            const transferIntentWithCode = {
                walletToDebit: senderWalletAccountNo,
                walletToCredit: receiverWalletAccountNo,
                otp: otp,
            };
            const response = yield wallet_authorizations_service_1.WalletAuthorization.verifyTransferOtp(transferIntentWithCode);
            console.log("Transfer verification response=====> ", response);
            if (!response.status) {
                throw new Error("Unauthorized transfer attempt");
            }
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
            const senderWalletAccountNo = debitDetails.walletAccountNo;
            const receiverWalletAccountNo = creditDetails.walletAccountNo;
            try {
                const senderWalletCurrency = debitDetails.currency;
                const reference = (0, helpers_1.generateReferenceCode)("CWT-");
                const validatedSenderWallet = yield WalletService.validateTransfer(senderWalletAccountNo, receiverWalletAccountNo, senderWalletCurrency, debitDetails.amount, debitDetails.otp);
                if (!validatedSenderWallet) {
                    throw new Error("Tranfer details could not be verified");
                }
                // Debit operation: Decrease balance for sender
                const senderWallet = yield wallet_model_1.Wallet.findOneAndUpdate({ walletAccountNo: senderWalletAccountNo }, { $inc: { balance: -1 * debitDetails.amount } }, { new: true } // Return the updated document
                );
                if (senderWallet) {
                    senderWallet.updatedAt = new Date();
                    yield senderWallet.save();
                }
                // Add rollback for debit (re-add the amount if something goes wrong later)
                let rollBackId = (0, crypto_1.randomUUID)();
                (0, rollback_service_1.registerRollback)(rollBackId, "UPDATE-ONE", "Wallet", { walletAccountNo: senderWalletAccountNo }, { $inc: { balance: debitDetails.amount } });
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
                        reference: reference,
                    });
                    rollBackId = (0, crypto_1.randomUUID)();
                    (0, rollback_service_1.registerRollback)(rollBackId, "DELETE", "Wallet", { _id: senderWalletTransaction._id });
                    yield senderWalletTransaction.populate("user", "_id firstname lastname username email geoData");
                    senderNotification =
                        yield wallet_notifications_service_1.WalletNotificationService.createDebitNotification(senderWallet, senderWalletTransaction);
                    //Redis Roll back...
                    rollBackId = (0, crypto_1.randomUUID)();
                    senderWalletTransaction.operationType = "credit";
                    (0, rollback_service_1.registerRollback)(rollBackId, "NOTIFICATION", "Notification", { wallet: senderWallet,
                        walletTransaction: senderWalletTransaction,
                        isRollBack: true
                    });
                }
                //Testing
                logger_1.default.info("TEST_ERROR " + (0, config_1.getTestConfig)().TEST_ERROR);
                console.log("TEST_ERROR " + (0, config_1.getTestConfig)().TEST_ERROR);
                if ((0, config_1.getTestConfig)().TEST_ERROR === "true") {
                    throw new Error("Error to test rollback mechanism");
                }
                if ((0, config_1.getTestConfig)().DISCONNECT_DATABASE === "true") {
                    yield (0, helpers_1.disconnectDatabase)();
                }
                // Credit operation: Increase balance for receiver
                const receiverWallet = yield wallet_model_1.Wallet.findOneAndUpdate({ walletAccountNo: receiverWalletAccountNo }, { $inc: { balance: creditDetails.amount } }, { new: true });
                // Add rollback for credit (subtract the amount if something goes wrong later)
                rollBackId = (0, crypto_1.randomUUID)();
                (0, rollback_service_1.registerRollback)(rollBackId, "UPDATE-ONE", "Wallet", { walletAccountNo: receiverWalletAccountNo }, { $inc: { balance: -1 * creditDetails.amount } });
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
                        reference: reference,
                    });
                    rollBackId = (0, crypto_1.randomUUID)();
                    (0, rollback_service_1.registerRollback)(rollBackId, "DELETE", "Wallet", { _id: receiverWalletTransaction._id });
                    receiverWalletTransaction = yield receiverWalletTransaction.populate("user", "_id firstname lastname username email geoData");
                    receiverNotification =
                        yield wallet_notifications_service_1.WalletNotificationService.createCreditNotification(receiverWallet, receiverWalletTransaction);
                    //Redis Roll back...
                    rollBackId = (0, crypto_1.randomUUID)();
                    (0, rollback_service_1.registerRollback)(rollBackId, "NOTIFICATION", "Notification", { wallet: receiverWallet,
                        walletTransaction: receiverWalletTransaction,
                        isRollBack: true
                    });
                }
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
                // Perform rollback actions and save fail job in database or redis
                yield (0, rollback_service_1.processRollbacks)();
                yield wallet_failurehandler_service_1.WalletFailedtasksHandler.registerfailedJob(type, amount, {
                    operationType: "wallet-transfer",
                    senderWalletAccountNo: senderWalletAccountNo,
                    receiverWalletAccountNo: receiverWalletAccountNo,
                    verifiedTransactionId: (0, crypto_1.randomUUID)(),
                });
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
                const payout = yield payouts_model_1.default.findOne({ _id: meta.payoutId });
                if (!payout) {
                    throw new Error("No payout exists for meta.payoutId");
                }
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
                    // Add rollback for debit (re-add the amount if something goes wrong later)
                    let inverseOperation = { $inc: { balance: positiveAmount } };
                    if (meta.operationType === "credit") {
                        inverseOperation = { $inc: { balance: -1 * positiveAmount } }; // Debit Operation
                    }
                    rollbackActions.push(() => __awaiter(this, void 0, void 0, function* () {
                        yield wallet_model_1.Wallet.findOneAndUpdate({ walletAccountNo: meta.walletAccountNo }, inverseOperation, { new: true });
                    }));
                    walletTransaction = yield wallet_transaction_model_1.WalletTransaction.create({
                        user: wallet.user,
                        payout: meta.payoutId,
                        amount: positiveAmount,
                        type: type,
                        operationType: meta.operationType,
                        reference: reference,
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
                walletNotification =
                    yield wallet_notifications_service_1.WalletNotificationService.createCreditNotification(wallet, walletTransaction);
                rollbackActions.push(() => __awaiter(this, void 0, void 0, function* () {
                    walletTransaction.operationType = "debit";
                    walletNotification =
                        yield wallet_notifications_service_1.WalletNotificationService.createDebitNotification(wallet, walletTransaction);
                }));
                payout.status = "Completed";
                payout.payoutDate = new Date();
                yield payout.save();
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
        return __awaiter(this, void 0, void 0, function* () {
            let rollbackActions = []; // To store rollback operations
            let walletTransaction = null;
            let walletNotification = null;
            const reference = (0, helpers_1.generateReferenceCode)("WDT-");
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
                // if (1 < 2) {
                //   throw new Error("Just a test error");
                // }
                if (wallet) {
                    // Add rollback for debit (re-add the amount if something goes wrong later)
                    let inverseOperation = { $inc: { balance: positiveAmount } };
                    if (meta.operationType === "credit") {
                        inverseOperation = { $inc: { balance: -1 * positiveAmount } }; // Debit Operation
                    }
                    rollbackActions.push(() => __awaiter(this, void 0, void 0, function* () {
                        yield wallet_model_1.Wallet.findOneAndUpdate({ walletAccountNo: meta.walletAccountNo }, inverseOperation, { new: true });
                    }));
                    walletTransaction = yield wallet_transaction_model_1.WalletTransaction.create({
                        user: wallet.user,
                        amount: positiveAmount,
                        type: type,
                        operationType: meta.operationType,
                        reference: reference,
                    });
                }
                walletTransaction = yield walletTransaction.populate("user", "_id firstname lastname username email geoData");
                walletNotification =
                    yield wallet_notifications_service_1.WalletNotificationService.createCreditNotification(wallet, walletTransaction);
                rollbackActions.push(() => __awaiter(this, void 0, void 0, function* () {
                    walletTransaction.operationType = "debit";
                    walletNotification =
                        yield wallet_notifications_service_1.WalletNotificationService.createDebitNotification(wallet, walletTransaction);
                }));
                console.log("Wallet direct top completed successfully.");
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
                yield wallet_failurehandler_service_1.WalletFailedtasksHandler.registerfailedJob(type, amount, meta);
            }
        });
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
                // Add rollback for debit (re-add the amount if something goes wrong later)
                let inverseOperation = { $inc: { balance: -1 * positiveAmount } };
                if (meta.operationType === "debit") {
                    inverseOperation = { $inc: { balance: positiveAmount } }; // Credit Operation
                }
                const wallet = yield wallet_model_1.Wallet.findOneAndUpdate({ walletAccountNo: meta.walletAccountNo }, operation, { new: true } // Return the updated document
                );
                rollbackActions.push(() => __awaiter(this, void 0, void 0, function* () {
                    yield wallet_model_1.Wallet.findOneAndUpdate({ walletAccountNo: meta.walletAccountNo }, inverseOperation, { new: true });
                }));
                if (!wallet) {
                    throw new Error("No wallet was fund for account number.");
                }
                if (meta.operationType === "debit") {
                    if (wallet.balance < positiveAmount) {
                        throw new Error("Insufficient balance in wallet");
                    }
                }
                // if (20 > 10) {
                //   throw new Error("Error to test rollback mechanism");
                // }
                if (wallet) {
                    walletTransaction = yield wallet_transaction_model_1.WalletTransaction.create({
                        user: wallet.user,
                        amount: positiveAmount,
                        type: type,
                        operationType: meta.operationType,
                        reference: reference,
                    });
                }
                walletTransaction = yield walletTransaction.populate("user", "_id firstname lastname username email geoData");
                // Add rollback for debit (re-add the amount if something goes wrong later)
                if (meta.operationType === "debit") {
                    walletNotification =
                        yield wallet_notifications_service_1.WalletNotificationService.createDebitNotification(wallet, walletTransaction);
                }
                // rollbackActions.push(() =>
                //   WalletTransaction.deleteOne({
                //     _id: walletTransaction!._id,
                //   })
                // );
                // rollbackActions.push(async () => {
                //   NotificationModel.deleteOne({
                //     _id: walletNotification!._id,
                //   });
                //   walletNotification =
                //     await WalletNotificationService.createCreditNotification(
                //       wallet,
                //       walletTransaction!
                //     );
                // });
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
                console.log("Meta afer rolback ", meta);
                meta.uuid = (0, crypto_1.randomUUID)();
                yield wallet_failurehandler_service_1.WalletFailedtasksHandler.registerfailedJob(type, amount, meta);
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
