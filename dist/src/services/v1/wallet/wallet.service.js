"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const axios_1 = __importDefault(require("axios"));
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
const crypto_1 = require("crypto");
const payouts_model_1 = __importDefault(require("../../../models/payouts.model"));
const wallet_authorizations_service_1 = require("./wallet-authorizations.service");
const logger_1 = __importDefault(require("../../../bootstrap/logger"));
const rollback_service_1 = require("./rollback.service");
const wallet_incomingpayments_model_1 = require("../../../models/wallet-incomingpayments.model");
const listingPurchase_model_1 = __importDefault(require("../../../models/listingPurchase.model"));
const verifiedtransactions_model_1 = __importDefault(require("../../../models/verifiedtransactions.model"));
const accounts_merchant_model_1 = __importDefault(require("../../../models/accounts-merchant.model"));
const cryptolisting_service_1 = require("../listingsServices/cryptolisting.service");
const wallet_externaltransactions_model_1 = require("../../../models/wallet-externaltransactions.model");
class WalletService {
    static generateRandomAccountNumber(account, isMerchant = false) {
        let merchantPrefix = "CMR-";
        const areaCode = account.geoData.isoCode; // ISO Code (e.g., "180")
        const shortTimestamp = Math.floor(Date.now() / 1000); // Current timestamp in seconds
        const walletAccountNo = `${merchantPrefix}${areaCode}${shortTimestamp}`;
        if (!isMerchant) {
            merchantPrefix = "";
        }
        return walletAccountNo;
    }
    static async generateUniqueAccountNumber(account, isMerchant = false) {
        let unique = false;
        let accountNumber;
        while (!unique) {
            accountNumber = WalletService.generateRandomAccountNumber(account, isMerchant);
            const existingAccount = await wallet_model_1.Wallet.findOne({ accountNumber });
            if (!existingAccount) {
                unique = true; // Exit the loop if the account number is unique
            }
        }
        return accountNumber;
    }
    static async createWallet(userId, isMerchant = false) {
        let userType = "accounts";
        let account = await accounts_model_1.default.findOne({ _id: userId });
        if (isMerchant) {
            userType = "merchantAccounts";
            account = await accounts_merchant_model_1.default.findOne({ _id: userId });
        }
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
        if (!account?.geoData?.currency?.code) {
            return {
                status: false,
                message: "Failed to create your wallet, please ensure you have updated preferred currency in profile section or try again later!",
            };
        }
        const walletAccountNo = await WalletService.generateUniqueAccountNumber(account, isMerchant);
        if (!walletAccountNo) {
            return {
                status: false,
                message: "Failed to generate an account number for wallet",
            };
        }
        const wallet = await wallet_model_1.Wallet.create({
            user: account._id,
            walletAccountNo,
            currency: account.geoData.currency.code,
            currencySymbol: account.geoData.currency.symbol,
            userType: userType,
            isMerchant: isMerchant,
        });
        if (wallet) {
            account.walletCreated = true;
            await account.save();
        }
        return {
            status: true,
            message: "Wallet created successfully.",
            wallet: wallet,
        };
    }
    static async getWallet(userId) {
        try {
            const wallet = await wallet_model_1.Wallet.findOne({ user: userId });
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
    }
    static async getReceipientWallet(walletId, accountId = null, isTransfer = true) {
        try {
            let myWallet = null;
            if (accountId) {
                myWallet = await wallet_model_1.Wallet.findOne({
                    user: accountId,
                });
            }
            if (isTransfer) {
                if (myWallet && myWallet?.walletAccountNo == walletId) {
                    return {
                        status: false,
                        message: "You cannot make a transfer to your own wallet, you can only transfer to other crygoca wallets",
                    };
                }
            }
            const wallet = await wallet_model_1.Wallet.findOne({
                walletAccountNo: walletId,
            }).populate({
                path: "user",
                model: "accounts", // Dynamically use the model name
            });
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
    }
    static async updateWalletBalance(type, amount, meta, //For Payout topup and direct topups
    debitDetails, creditDetails, saveBeneficiary) {
        console.log("Payment TYpe ", type);
        if (type === "wallet-transfer") {
            return await WalletService.walletTransfer(type, amount, debitDetails, creditDetails, saveBeneficiary);
        }
        else if (type === "wallet-balance-payment") {
            return await WalletService.walletBalancePayment(type, amount, debitDetails, creditDetails, saveBeneficiary, meta);
        }
        else if (type === "external-wallet-balance-payment") {
            return await WalletService.externalWalletBalancePayment(type, amount, debitDetails, creditDetails, saveBeneficiary, meta);
        }
        else if (type === "payout-topup") {
            return await WalletService.walletPayoutTopUp(type, amount, meta);
        }
        else if (type === "direct-topup") {
            return await WalletService.walletDirectTopUp(type, amount, meta);
        }
        else if (type === "wallet-withdrawal") {
            return await WalletService.walletWithdrawal(type, amount, meta);
        }
    }
    static async validateTransfer(senderWalletAccountNo, receiverWalletAccountNo, currency, amount, otp) {
        // Debit operation: Decrease balance for sender
        const senderWallet = await wallet_model_1.Wallet.findOne({
            walletAccountNo: senderWalletAccountNo,
        });
        const receiverWallet = await wallet_model_1.Wallet.findOne({
            walletAccountNo: receiverWalletAccountNo,
        });
        const transferIntentWithCode = {
            walletToDebit: senderWalletAccountNo,
            walletToCredit: receiverWalletAccountNo,
            otp: otp,
        };
        const response = await wallet_authorizations_service_1.WalletAuthorization.verifyTransferOtp(transferIntentWithCode);
        logger_1.default.info("Transfer verification response=====> ", response);
        if (!response.status) {
            throw new Error("Unauthorized transfer attempt");
        }
        logger_1.default.info(senderWalletAccountNo, currency, amount, senderWallet);
        if (!senderWallet) {
            throw new Error("Sender has no wallet");
        }
        if (!receiverWallet) {
            throw new Error("Receipient has no wallet");
        }
        if (currency !== senderWallet.currency) {
            throw new Error("Invalid currency for sender's wallet");
        }
        console.log("Sender Wallet & balance ", senderWallet.balance, amount, senderWallet.balance < amount);
        if (senderWallet.balance < amount) {
            throw new Error("Insufficient balance in sender's wallet");
        }
        return senderWallet;
    }
    static async walletTransfer(type, amount, debitDetails, creditDetails, saveBeneficiary) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction(); // Start the transaction
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
            const validatedSenderWallet = await WalletService.validateTransfer(senderWalletAccountNo, receiverWalletAccountNo, senderWalletCurrency, debitDetails.amount, debitDetails.otp);
            if (!validatedSenderWallet) {
                throw new Error("Transfer details could not be verified");
            }
            // Debit operation: Decrease balance for sender
            const senderWallet = await wallet_model_1.Wallet.findOneAndUpdate({ walletAccountNo: senderWalletAccountNo }, { $inc: { balance: -1 * debitDetails.amount } }, { session, new: true } // Return the updated document
            );
            if (senderWallet) {
                senderWallet.updatedAt = new Date();
                await senderWallet.save({ session });
            }
            if (!senderWallet) {
                throw new Error("Sender has no wallet");
            }
            senderWalletTransaction = await wallet_transaction_model_1.WalletTransaction.create([
                {
                    user: senderWallet.user,
                    creditWalletAccountNo: receiverWalletAccountNo,
                    debitWalletAccountNo: senderWalletAccountNo,
                    amount: debitDetails.amount,
                    type: type,
                    operationType: "debit",
                    reference: reference,
                },
            ], { session } // ✅ Pass session as an option
            );
            senderWalletTransaction = senderWalletTransaction[0];
            await senderWalletTransaction.populate("user", "_id firstname lastname username email geoData");
            senderNotification =
                await wallet_notifications_service_1.WalletNotificationService.createDebitNotification(senderWallet, senderWalletTransaction);
            //Redis Roll back notification...
            let rollBackId = (0, crypto_1.randomUUID)();
            rollBackId = (0, crypto_1.randomUUID)();
            senderWalletTransaction.operationType = "credit";
            (0, rollback_service_1.registerRollback)(rollBackId, "NOTIFICATION", "Notification", {
                wallet: senderWallet,
                walletTransaction: senderWalletTransaction,
                isRollBack: true,
            });
            // Credit operation: Increase balance for receiver
            const receiverWallet = await wallet_model_1.Wallet.findOneAndUpdate({ walletAccountNo: receiverWalletAccountNo }, { $inc: { balance: creditDetails.amount } }, { session, new: true });
            if (!receiverWallet) {
                throw new Error("Receiver wallet not found");
            }
            else {
                receiverWalletTransaction = await wallet_transaction_model_1.WalletTransaction.create([
                    {
                        user: receiverWallet.user,
                        creditWalletAccountNo: receiverWalletAccountNo,
                        debitWalletAccountNo: senderWalletAccountNo,
                        amount: creditDetails.amount,
                        type: type,
                        operationType: "credit",
                        reference: reference,
                    },
                ], { session } // ✅ Pass session as an option);
                );
                receiverWalletTransaction = receiverWalletTransaction[0];
                receiverWalletTransaction = await receiverWalletTransaction.populate("user", "_id firstname lastname username email geoData");
                receiverNotification =
                    await wallet_notifications_service_1.WalletNotificationService.createCreditNotification(receiverWallet, receiverWalletTransaction);
                //Redis Roll back notification...
                rollBackId = (0, crypto_1.randomUUID)();
                (0, rollback_service_1.registerRollback)(rollBackId, "NOTIFICATION", "Notification", {
                    wallet: receiverWallet,
                    walletTransaction: receiverWalletTransaction,
                    isRollBack: true,
                });
            }
            if (saveBeneficiary) {
                const beneficiaryData = {
                    account: senderWallet.user,
                    beneficiaryAccount: receiverWallet.user,
                    receiverWallet: receiverWallet,
                };
                const beneficiary = await wallet_beneficiaries_model_1.WalletBeneficiary.findOne({
                    account: senderWallet.user,
                    beneficiaryAccount: receiverWallet.user,
                }).session(session);
                if (!beneficiary) {
                    await wallet_beneficiaries_model_1.WalletBeneficiary.create([beneficiaryData], { session });
                }
            }
            await session.commitTransaction(); // Commit if successful
            logger_1.default.info("Wallet operations completed successfully.");
        }
        catch (error) {
            logger_1.default.info("Error occurred:" + error?.message);
            await session.abortTransaction(); // Rollback on failure
            (0, rollback_service_1.processRollbacks)();
        }
        finally {
            session.endSession();
        }
    }
    static async walletBalancePayment(type, amount, debitDetails, creditDetails, saveBeneficiary, meta) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction(); // Start the transaction
        let rollbackActions = []; // To store rollback operations
        let senderWalletTransaction = null;
        let receiverWalletTransaction = null;
        let senderNotification = null;
        let receiverNotification = null;
        const senderWalletAccountNo = debitDetails.walletAccountNo;
        const receiverWalletAccountNo = creditDetails.walletAccountNo;
        if (!meta) {
            throw new Error("No order reference for payment was detected...");
        }
        try {
            const senderWalletCurrency = debitDetails.currency;
            const reference = (0, helpers_1.generateReferenceCode)("CWP-");
            // Debit operation: Decrease balance for sender
            const senderWallet = await wallet_model_1.Wallet.findOneAndUpdate({ walletAccountNo: senderWalletAccountNo }, { $inc: { balance: -1 * debitDetails.amount } }, { session, new: true } // Return the updated document
            );
            if (senderWallet) {
                senderWallet.updatedAt = new Date();
                await senderWallet.save({ session });
            }
            let rollBackId = (0, crypto_1.randomUUID)();
            if (!senderWallet) {
                throw new Error("Sender has no wallet");
            }
            senderWalletTransaction = await wallet_transaction_model_1.WalletTransaction.create([
                {
                    user: senderWallet.user,
                    creditWalletAccountNo: receiverWalletAccountNo,
                    debitWalletAccountNo: senderWalletAccountNo,
                    amount: debitDetails.amount,
                    type: type,
                    operationType: "debit",
                    reference: reference,
                },
            ], { session });
            senderWalletTransaction = senderWalletTransaction[0];
            await senderWalletTransaction.populate("user", "_id firstname lastname username email geoData");
            senderNotification =
                await wallet_notifications_service_1.WalletNotificationService.createDebitNotification(senderWallet, senderWalletTransaction, false, true);
            //Redis Roll back...
            rollBackId = (0, crypto_1.randomUUID)();
            senderWalletTransaction.operationType = "credit";
            (0, rollback_service_1.registerRollback)(rollBackId, "NOTIFICATION", "Notification", {
                wallet: senderWallet,
                walletTransaction: senderWalletTransaction,
                isRollBack: true,
            });
            const receiverWallet = await wallet_model_1.Wallet.findOne({
                walletAccountNo: receiverWalletAccountNo,
            }).populate({
                path: "user",
                model: "accounts",
            });
            if (!receiverWallet) {
                throw new Error("Receiver wallet not found");
            }
            // Credit operation: Increase balance for receiver
            const incomingpaymentData = {
                wallet: receiverWallet._id,
                checkOutId: meta.checkOutId,
                status: "PENDING",
                amount: creditDetails.amount,
                currency: creditDetails.currency,
                debitWalletAccountNo: senderWalletAccountNo,
            };
            let walletIncomingPayment = await wallet_incomingpayments_model_1.WalletIncomingPayments.create([incomingpaymentData], { session });
            walletIncomingPayment = walletIncomingPayment[0];
            receiverNotification =
                await wallet_notifications_service_1.WalletNotificationService.createIncomingPaymentNotification(receiverWallet, walletIncomingPayment);
            //Redis Roll back...
            rollBackId = (0, crypto_1.randomUUID)();
            (0, rollback_service_1.registerRollback)(rollBackId, "NOTIFICATION", "Notification", {
                wallet: receiverWallet,
                walletTransaction: receiverWalletTransaction,
                isRollBack: true,
            });
            const accountId = senderWallet.user;
            const account = await accounts_model_1.default.findOne({ _id: accountId }).session(session);
            const paymentData = {
                tx_ref: meta.checkOutId,
                amount: creditDetails.amount,
                // senderCurrency: senderWallet.currency,
                currency: creditDetails.currency,
                charged_amount: creditDetails.amount,
                app_fee: 0.0,
                status: "successful",
                payment_type: "crygoca-wallet",
            };
            let verifiedTransaction = await verifiedtransactions_model_1.default.create([
                {
                    tx_ref: meta.checkOutId,
                    data: paymentData,
                    account: account._id,
                    paymentProcessor: "CRYGOCA"
                },
            ], { session });
            verifiedTransaction = verifiedTransaction[0];
            const cryptoPurchase = await listingPurchase_model_1.default.findOne({ checkOutId: verifiedTransaction.tx_ref }, null, // Projection (keep `null` if not needed)
            { session } // ✅ Pass session correctly
            );
            if (cryptoPurchase) {
                cryptoPurchase.verifiedTransaction = verifiedTransaction._id;
                cryptoPurchase.paymentConfirmed = true;
                await cryptoPurchase.save({ session });
            }
            await (0, cryptolisting_service_1.updatePaymentConfirmation)(verifiedTransaction.tx_ref);
            await session.commitTransaction(); // Commit if successful
            logger_1.default.info("Wallet balance payment operations completed successfully.");
        }
        catch (error) {
            logger_1.default.info(error?.toString());
            logger_1.default.info("Error occurred:" + error?.message);
            await session.abortTransaction(); // Rollback on failure
            await (0, rollback_service_1.processRollbacks)();
        }
        finally {
            session.endSession();
        }
    }
    static async externalWalletBalancePayment(type, amount, debitDetails, creditDetails, saveBeneficiary, meta) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction(); // Start the transaction
        let rollbackActions = []; // To store rollback operations
        let senderWalletTransaction = null;
        let receiverWalletTransaction = null;
        let senderNotification = null;
        let receiverNotification = null;
        const senderWalletAccountNo = debitDetails.walletAccountNo;
        const receiverWalletAccountNo = creditDetails.walletAccountNo;
        try {
            const walletTx = await wallet_externaltransactions_model_1.WalletExternalTransactions.findOne({
                txRef: meta.checkOutId,
            });
            if (!walletTx) {
                throw new Error("No transaction found for transaction reference");
            }
            const senderWalletCurrency = debitDetails.currency;
            const reference = (0, helpers_1.generateReferenceCode)("CWT-");
            const _senderWallet = await wallet_model_1.Wallet.findOne({
                walletAccountNo: senderWalletAccountNo,
            });
            const _receiverWallet = await wallet_model_1.Wallet.findOne({
                walletAccountNo: receiverWalletAccountNo,
            });
            if (!_senderWallet) {
                return {
                    status: false,
                    message: "No wallet was found for customer",
                };
            }
            if (!_receiverWallet) {
                return {
                    status: false,
                    message: "No wallet was found for merchant",
                };
            }
            // Debit operation: Decrease balance for sender
            const senderWallet = await wallet_model_1.Wallet.findOneAndUpdate({ walletAccountNo: senderWalletAccountNo }, { $inc: { balance: -1 * debitDetails.amount } }, { session, new: true } // Return the updated document
            );
            if (senderWallet) {
                senderWallet.updatedAt = new Date();
                await senderWallet.save({ session });
            }
            // Add rollback for debit (re-add the amount if something goes wrong later)
            let rollBackId = (0, crypto_1.randomUUID)();
            if (!senderWallet) {
                throw new Error("Sender has no wallet");
            }
            senderWalletTransaction = await wallet_transaction_model_1.WalletTransaction.create([
                {
                    user: senderWallet.user,
                    creditWalletAccountNo: receiverWalletAccountNo,
                    debitWalletAccountNo: senderWalletAccountNo,
                    amount: debitDetails.amount,
                    type: type,
                    operationType: "debit",
                    reference: reference,
                },
            ], { session });
            senderWalletTransaction = senderWalletTransaction[0];
            await senderWalletTransaction.populate("user", "_id firstname lastname username email geoData");
            senderNotification =
                await wallet_notifications_service_1.WalletNotificationService.createDebitNotification(senderWallet, senderWalletTransaction);
            //Redis Roll back...
            rollBackId = (0, crypto_1.randomUUID)();
            senderWalletTransaction.operationType = "credit";
            (0, rollback_service_1.registerRollback)(rollBackId, "NOTIFICATION", "Notification", {
                wallet: senderWallet,
                walletTransaction: senderWalletTransaction,
                isRollBack: true,
            });
            // Credit operation: Increase balance for receiver
            const receiverWallet = await wallet_model_1.Wallet.findOneAndUpdate({
                walletAccountNo: receiverWalletAccountNo,
                userType: "merchantAccounts",
            }, { $inc: { balance: creditDetails.amount } }, { session, new: true }).populate({
                path: "user",
                model: "merchantAccounts",
            });
            walletTx.status = "SUCCESS";
            await walletTx.save({ session });
            if (!receiverWallet) {
                throw new Error("Receiver wallet not found");
            }
            else {
                receiverWalletTransaction = await wallet_transaction_model_1.WalletTransaction.create([
                    {
                        user: receiverWallet.user,
                        creditWalletAccountNo: receiverWalletAccountNo,
                        debitWalletAccountNo: senderWalletAccountNo,
                        amount: creditDetails.amount,
                        type: type,
                        operationType: "credit",
                        reference: reference,
                    },
                ], { session });
                receiverWalletTransaction = receiverWalletTransaction[0];
                receiverWalletTransaction = await receiverWalletTransaction.populate("user", "_id firstname lastname username email geoData");
                receiverWalletTransaction.user = receiverWallet.user;
                receiverNotification =
                    await wallet_notifications_service_1.WalletNotificationService.createExternalPaymentCreditNotification(receiverWallet, receiverWalletTransaction);
                //Redis Roll back...
                rollBackId = (0, crypto_1.randomUUID)();
                (0, rollback_service_1.registerRollback)(rollBackId, "NOTIFICATION", "Notification", {
                    wallet: receiverWallet,
                    walletTransaction: receiverWalletTransaction,
                    isRollBack: true,
                });
            }
            if (saveBeneficiary) {
                const beneficiaryData = {
                    account: senderWallet.user,
                    beneficiaryAccount: receiverWallet.user,
                    receiverWallet: receiverWallet,
                };
                const beneficiary = await wallet_beneficiaries_model_1.WalletBeneficiary.findOne({
                    account: senderWallet.user,
                    beneficiaryAccount: receiverWallet.user,
                });
                if (!beneficiary) {
                    await wallet_beneficiaries_model_1.WalletBeneficiary.create([beneficiaryData], { session });
                }
            }
            await session.commitTransaction(); // Commit if successful
            logger_1.default.info("Wallet operations completed successfully.");
        }
        catch (error) {
            await session.abortTransaction(); // Rollback on failure
            logger_1.default.info("Error occurred:" + error?.message);
            await (0, rollback_service_1.processRollbacks)();
        }
        finally {
            session.endSession();
        }
    }
    static async walletPayoutTopUp(type, amount, meta) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction(); // Start the transaction
        let rollbackActions = []; // To store rollback operations
        let walletTransaction = null;
        let walletNotification = null;
        const reference = (0, helpers_1.generateReferenceCode)("CWP-");
        try {
            const payout = await payouts_model_1.default.findOne({ _id: meta.payoutId });
            if (!payout) {
                throw new Error("No payout exists for meta.payoutId");
            }
            const positiveAmount = Math.abs(amount);
            let operation = { $inc: { balance: -1 * positiveAmount } }; // Debit Operation
            if (meta.operationType === "credit") {
                operation = { $inc: { balance: positiveAmount } }; // Credit Operation
            }
            const wallet = await wallet_model_1.Wallet.findOneAndUpdate({ walletAccountNo: meta.walletAccountNo }, operation, { session, new: true } // Return the updated document
            );
            if (!wallet) {
                throw new Error("No wallet was fund for account number.");
            }
            let rollBackId = (0, crypto_1.randomUUID)();
            if (wallet) {
                // Add rollback for debit (re-add the amount if something goes wrong later)
                let inverseOperation = { $inc: { balance: positiveAmount } };
                if (meta.operationType === "credit") {
                    inverseOperation = { $inc: { balance: -1 * positiveAmount } }; // Debit Operation
                }
                walletTransaction = await wallet_transaction_model_1.WalletTransaction.create([
                    {
                        user: wallet.user,
                        payout: meta.payoutId,
                        amount: positiveAmount,
                        type: type,
                        operationType: meta.operationType,
                        reference: reference,
                    },
                ], { session });
            }
            walletTransaction = walletTransaction[0];
            if (walletTransaction?.payout) {
                walletTransaction = await walletTransaction.populate({
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
            walletTransaction = await walletTransaction.populate("user", "_id firstname lastname username email geoData");
            walletNotification =
                await wallet_notifications_service_1.WalletNotificationService.createCreditNotification(wallet, walletTransaction);
            rollBackId = (0, crypto_1.randomUUID)();
            (0, rollback_service_1.registerRollback)(rollBackId, "NOTIFICATION", "Notification", {
                wallet,
                walletTransaction,
            });
            payout.status = "Completed";
            payout.payoutDate = new Date();
            await payout.save({ session });
            await session.commitTransaction(); // Commit if successful
            logger_1.default.info("Wallet operations completed successfully.");
        }
        catch (error) {
            logger_1.default.error("Error occurred:", error.message);
            await session.abortTransaction(); // Rollback on failure
            await (0, rollback_service_1.processRollbacks)();
        }
        finally {
            session.endSession();
        }
    }
    static async walletDirectTopUp(type, amount, meta) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction(); // Start the transaction
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
            const wallet = await wallet_model_1.Wallet.findOneAndUpdate({ walletAccountNo: meta.walletAccountNo }, operation, { session, new: true } // Return the updated document
            );
            if (!wallet) {
                throw new Error("No wallet was found for account number.");
            }
            if (wallet) {
                walletTransaction = await wallet_transaction_model_1.WalletTransaction.create([
                    {
                        user: wallet.user,
                        amount: positiveAmount,
                        type: type,
                        operationType: meta.operationType,
                        reference: reference,
                    },
                ], { session });
            }
            walletTransaction = walletTransaction[0];
            walletTransaction = await walletTransaction.populate("user", "_id firstname lastname username email geoData");
            walletNotification =
                await wallet_notifications_service_1.WalletNotificationService.createCreditNotification(wallet, walletTransaction);
            rollbackActions.push(async () => {
                walletTransaction.operationType = "debit";
                walletNotification =
                    await wallet_notifications_service_1.WalletNotificationService.createDebitNotification(wallet, walletTransaction);
            });
            await session.commitTransaction(); // Commit if successful
            logger_1.default.info("Wallet direct top completed successfully.");
        }
        catch (error) {
            await session.abortTransaction(); // Rollback on failure
            logger_1.default.error("Error occurred:", error.message);
            for (const rollback of rollbackActions) {
                try {
                    await rollback(); // Execute each rollback operation
                }
                catch (rollbackError) {
                    logger_1.default.info("Rollback failed:", rollbackError.message);
                }
            }
            logger_1.default.info("All operations were rolled back.");
        }
        finally {
            session.endSession();
        }
    }
    static async walletGetBeneficiaries(req) {
        try {
            let wallet = null;
            const page = parseInt(req.query.page, 10) || 1;
            const limit = parseInt(req.query.limit, 10) || 10;
            const skip = (page - 1) * limit;
            const accountId = req.accountId;
            const query = { account: accountId };
            const walletResponse = await WalletService.getWallet(new mongoose_1.default.Types.ObjectId(accountId));
            if (walletResponse.status) {
                wallet = walletResponse.data;
            }
            const beneficiaries = await wallet_beneficiaries_model_1.WalletBeneficiary.find(query)
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
            const totalDocuments = await wallet_beneficiaries_model_1.WalletBeneficiary.countDocuments(query);
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
    }
    static async walletWithdrawal(type, amount, meta) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction(); // Start the transaction
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
            //The two blocks below may be unneccessary as validation was done in controller.
            const _wallet = await wallet_model_1.Wallet.findOne({
                walletAccountNo: meta.walletAccountNo,
            });
            if (!_wallet) {
                throw new Error("No source wallet was found..");
            }
            if (meta.operationType === "debit") {
                if (_wallet.balance < positiveAmount) {
                    throw new Error("Insufficient balance in wallet");
                }
            }
            const wallet = await wallet_model_1.Wallet.findOneAndUpdate({ walletAccountNo: meta.walletAccountNo }, operation, { session, new: true } // Return the updated document
            );
            if (!wallet) {
                throw new Error("No wallet was fund for account number.");
            }
            if (wallet) {
                walletTransaction = await wallet_transaction_model_1.WalletTransaction.create([
                    {
                        user: wallet.user,
                        amount: positiveAmount,
                        type: type,
                        operationType: meta.operationType,
                        reference: reference,
                    },
                ], { session });
            }
            walletTransaction = walletTransaction[0];
            walletTransaction = await walletTransaction.populate("user", "_id firstname lastname username email geoData");
            if (meta.operationType === "debit") {
                walletNotification =
                    await wallet_notifications_service_1.WalletNotificationService.createDebitNotification(wallet, walletTransaction);
            }
            await session.commitTransaction(); // Commit if successful
            logger_1.default.info("Wallet Withdrawal operations completed successfully.");
        }
        catch (error) {
            await session.abortTransaction(); // Rollback on failure
            for (const rollback of rollbackActions) {
                try {
                    await rollback(); // Execute each rollback operation
                }
                catch (rollbackError) {
                    logger_1.default.error("Rollback failed:", rollbackError.message);
                }
            }
            logger_1.default.error("All operations were rolled back.");
        }
        finally {
            session.endSession();
        }
    }
    static async processToLocalBankWithdrawal(type, data, hash, accountId) {
        const session = await mongoose_1.default.startSession();
        session.startTransaction(); // Start the transaction
        try {
            if (type !== "wallet-to-bank-withdrawal") {
                throw new Error("Invalid request and operation type");
            }
            const senderWallet = await wallet_model_1.Wallet.findOne({
                user: accountId,
            });
            if (!senderWallet) {
                throw new Error("Sender has no wallet");
            }
            if (senderWallet.balance < data.amount) {
                throw new Error("Insufficient balance in wallet");
            }
            data.reference = (0, helpers_1.generateReferenceCode)("BW-");
            logger_1.default.info("Complete Withdrawal data ===> ", data);
            const withdrawalResponse = await (0, transfers_handlers_1.withdrawToLocalBankHandler)(data);
            logger_1.default.info("WithdrawalResponse ===> ", withdrawalResponse);
            let withdrawal = await withdrawals_model_1.default.create([
                {
                    wallet: senderWallet._id,
                    account: new mongoose_1.default.Types.ObjectId(accountId),
                    status: withdrawalResponse.data.status,
                    hash: hash,
                    reference: data.reference,
                    payload: data,
                    queuedResponse: withdrawalResponse,
                },
            ], { session });
            withdrawal = withdrawal[0];
            if (withdrawal.status === "NEW") {
                const withdrawalStatusQueue = new withdrawals_status_queue_1.WithdrawalStatusQueue();
                await withdrawalStatusQueue.enqueue(withdrawal);
                //Debit customer's wallet
                await (0, transfers_queue_1.addWalletBalanceUpdateJob)("wallet-withdrawal", withdrawalResponse.data.amount, {
                    operationType: "debit",
                    walletAccountNo: senderWallet.walletAccountNo,
                });
                await session.commitTransaction(); // Commit if successful
            }
        }
        catch (error) {
            await session.abortTransaction(); // Rollback on failure
            logger_1.default.info("Withdrawal error ", error?.message);
        }
        finally {
            session.endSession();
        }
    }
    static async updateWithdrawalStatus(data) {
        try {
            const withdrawal = await withdrawals_model_1.default.findOne({
                _id: data.initialPayload._id,
            });
            if (withdrawal) {
                withdrawal.status = "SUCCESS";
                withdrawal.verificationResponse = data.transferRespponse;
                await withdrawal.save();
            }
        }
        catch (error) { }
    }
    static async makeExternalPayment(payload) {
        const url = `${process.env.CRYGOCA_SERVER_URL}/api/v1/wallet/create-payment`;
        console.log("process.env.CRYGOCA_SECRET_KEY ", process.env.CRYGOCA_SECRET_KEY);
        try {
            const response = await axios_1.default.post(url, payload, {
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": `${process.env.CRYGOCA_SECRET_KEY}`, // Add token if available
                },
            });
            return { code: response.status, data: response.data };
        }
        catch (error) {
            console.error("Error processing wallet payment:", error.response?.data || error.message);
            return {
                message: "Error processing wallet payment",
                error: error.response?.data || error.message,
            };
        }
    }
}
exports.WalletService = WalletService;
