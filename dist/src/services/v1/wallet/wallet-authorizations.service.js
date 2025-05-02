"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.WalletAuthorization = void 0;
const wallet_model_1 = require("../../../models/wallet.model");
const accounts_model_1 = __importDefault(require("../../../models/accounts.model"));
const mailservice_1 = __importDefault(require("../mail/mailservice"));
const helper_1 = require("../auth/helper");
const wallet_service_1 = require("./wallet.service");
const CryptoJS = __importStar(require("crypto-js"));
const listingPurchase_model_1 = __importDefault(require("../../../models/listingPurchase.model"));
const wallet_incomingpayments_model_1 = require("../../../models/wallet-incomingpayments.model");
const wallet_externaltransactions_model_1 = require("../../../models/wallet-externaltransactions.model");
const merchant_credentials_model_1 = __importDefault(require("../../../models/merchant-credentials.model"));
class WalletAuthorization {
    static sendTransferOtp(transferIntent) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (transferIntent) {
                    let debitWalletResponse = yield wallet_service_1.WalletService.getReceipientWallet(transferIntent.walletToDebit);
                    let creditWalletResponse = yield wallet_service_1.WalletService.getReceipientWallet(transferIntent.walletToCredit);
                    if (!debitWalletResponse.wallet || !creditWalletResponse.wallet) {
                        return {
                            status: false,
                            message: "Creditor/Debitor was not found for this request",
                        };
                    }
                    let otp = (0, helper_1.generateOtp)();
                    if (process.env.MOCK_EXCHANGE_RATE === "true") {
                        otp = "1234";
                    }
                    console.log("Transfers OTP ", otp);
                    let clonedWallet = JSON.parse(JSON.stringify(debitWalletResponse.wallet));
                    yield (0, helper_1.setExpirableCode)(`${transferIntent.walletToDebit}:${transferIntent.walletToCredit}`, "transfers-otp", otp);
                    /*Send otp to email */
                    if (clonedWallet.user.useTransferOtpEmail) {
                        transferIntent.user = clonedWallet.user;
                        mailservice_1.default.wallet.sendTransferConfirmationOtp(clonedWallet.user.email, Number(otp), transferIntent);
                    }
                    if (clonedWallet.user.useTransferOtpSms) {
                        /*Send otp to sms */
                        // mailActions.auth.sendEmailConfirmationOtp(result.email, otp);
                    }
                    return {
                        status: true,
                        message: "Transfer otp sent sucessfully",
                    };
                }
                return {
                    status: false,
                    message: "Failed to send transfer otp!",
                };
            }
            catch (error) {
                throw error;
            }
        });
    }
    static verifyTransferOtp(transferIntent) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (transferIntent) {
                    let debitWalletResponse = yield wallet_service_1.WalletService.getReceipientWallet(transferIntent.walletToDebit);
                    let creditWalletResponse = yield wallet_service_1.WalletService.getReceipientWallet(transferIntent.walletToCredit);
                    if (!debitWalletResponse.wallet || !creditWalletResponse.wallet) {
                        return {
                            status: false,
                            message: "Creditor/Debitor was not found for this request",
                        };
                    }
                    const cachedCode = yield (0, helper_1.getExpirableCode)("transfers-otp", `${transferIntent.walletToDebit}:${transferIntent.walletToCredit}`);
                    console.log("cachedCode", cachedCode);
                    console.log("OTPS ", cachedCode === null || cachedCode === void 0 ? void 0 : cachedCode.code, transferIntent.otp);
                    if (cachedCode) {
                        if ((cachedCode === null || cachedCode === void 0 ? void 0 : cachedCode.code) === transferIntent.otp) {
                            return {
                                status: true,
                                message: "Transfer request authorized",
                            };
                        }
                    }
                    return {
                        status: false,
                        message: "Transfer request authorization failed",
                    };
                }
                return {
                    status: false,
                    message: "Transfer request authorization failed",
                };
            }
            catch (error) {
                throw error;
            }
        });
    }
    static sendWithdrawalOtp(accountId, payloadHash) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const account = yield accounts_model_1.default.findOne({ _id: accountId });
                if (!account) {
                    return {
                        status: false,
                        message: "No account was found for this request",
                    };
                }
                if (payloadHash) {
                    const otp = (0, helper_1.generateOtp)();
                    console.log("Withdrawal OTP ", otp);
                    const key = `${accountId}:${payloadHash}`;
                    yield (0, helper_1.setExpirableCode)(key, "withdrawal-otp", otp);
                    /*Send otp to email */
                    if (account.useTransferOtpEmail) {
                        mailservice_1.default.wallet.sendWithdrawalConfirmationOtp(account.email, Number(otp));
                    }
                    if (account.useTransferOtpSms) {
                        /*Send otp to sms */
                        // mailActions.auth.sendEmailConfirmationOtp(result.email, otp);
                    }
                    return {
                        status: true,
                        message: "Withdrawal otp sent sucessfully",
                    };
                }
                return {
                    status: false,
                    message: "Failed to send withdrawal otp!",
                };
            }
            catch (error) {
                throw error;
            }
        });
    }
    static verifyWithdrawalOtp(withdrawalIntent) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = `${withdrawalIntent.accountId}:${withdrawalIntent.payloadHash}`;
                if (withdrawalIntent) {
                    const cachedCode = yield (0, helper_1.getExpirableCode)("withdrawal-otp", key);
                    console.log("cachedCode", cachedCode);
                    if (cachedCode) {
                        if ((cachedCode === null || cachedCode === void 0 ? void 0 : cachedCode.code) === withdrawalIntent.otp) {
                            yield (0, helper_1.setExpirableCode)(key, "withdrawal-authorization", "authorized", 120);
                            return {
                                status: true,
                                message: "Withdrawal request authorized",
                            };
                        }
                    }
                    return {
                        status: false,
                        message: "Withdrawal request authorization failed",
                    };
                }
                return {
                    status: false,
                    message: "Withdrawal request authorization failed",
                };
            }
            catch (error) {
                throw error;
            }
        });
    }
    static sendWalletPaymentAuthorizationPin(accountId, payloadHash, checkOutId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const account = yield accounts_model_1.default.findOne({ _id: accountId });
                if (!account) {
                    return {
                        status: false,
                        message: "No account was found for this request",
                    };
                }
                const previousPayment = yield wallet_incomingpayments_model_1.WalletIncomingPayments.findOne({
                    checkOutId: checkOutId,
                });
                if (previousPayment) {
                    return {
                        status: false,
                        message: "This transaction already has a payment.",
                    };
                }
                if (payloadHash) {
                    const otp = (0, helper_1.generateOtp)();
                    console.log("Wallet Balance Payment OTP ", otp);
                    const key = `${accountId}:${payloadHash}`;
                    yield (0, helper_1.setExpirableCode)(key, "crygoca-balance-pay", otp);
                    /*Send otp to email */
                    mailservice_1.default.wallet.sendWalletPaymentAuthorizationPin(account.email, Number(otp), checkOutId, account);
                    return {
                        status: true,
                        message: "Wallet Payment Authorization pin sent sucessfully",
                    };
                }
                return {
                    status: false,
                    message: "Failed to send Wallet Payment Authorization pin!",
                };
            }
            catch (error) {
                throw error;
            }
        });
    }
    static validateWalletPaymentAuthorizationPin(accountId_1, paymentHash_1, authorizationPin_1, checkOutId_1) {
        return __awaiter(this, arguments, void 0, function* (accountId, paymentHash, authorizationPin, checkOutId, isExternal = false) {
            try {
                const key = `${accountId}:${paymentHash}`;
                const previousPayment = yield wallet_incomingpayments_model_1.WalletIncomingPayments.findOne({
                    checkOutId: checkOutId,
                });
                if (previousPayment) {
                    return {
                        status: false,
                        message: "This transaction already has a payment.",
                    };
                }
                if (!isExternal) {
                    const purchaseIntent = yield listingPurchase_model_1.default.findOne({
                        checkOutId: checkOutId,
                    });
                    if (!purchaseIntent) {
                        return {
                            status: false,
                            message: "No checkout intent was found for this action.",
                        };
                    }
                }
                if (authorizationPin) {
                    const cachedCode = yield (0, helper_1.getExpirableCode)("crygoca-balance-pay", key);
                    console.log("cachedCodeAuthPin", cachedCode);
                    if (cachedCode) {
                        if ((cachedCode === null || cachedCode === void 0 ? void 0 : cachedCode.code) === authorizationPin) {
                            yield (0, helper_1.setExpirableCode)(key, "wallet-pay-authorization", "authorized", 120);
                            return {
                                status: true,
                                message: "Wallet payment request authorized",
                            };
                        }
                    }
                    return {
                        status: false,
                        message: "Wallet payment authorization failed, enter a valid authorization pin",
                    };
                }
                return {
                    status: false,
                    message: "No valid authorization pin was sent",
                };
            }
            catch (error) {
                throw error;
            }
        });
    }
    static sendExternalWalletPaymentAuthorizationPin(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payloadHash = payload.payloadHash;
                const txRef = payload.txRef;
                const accountId = payload.accountId;
                const merchantCredentials = payload.merchantCredentials;
                const merchantCredentialsDb = yield merchant_credentials_model_1.default.findOne({
                    $or: [
                        { livePublicKey: merchantCredentials.livePublicKey },
                        { testPublicKey: merchantCredentials.testPublicKey },
                    ],
                });
                if (!merchantCredentialsDb) {
                    return {
                        status: false,
                        message: "Unauthorized merchant.",
                    };
                }
                const merchantAccountId = merchantCredentialsDb.account.toString();
                const account = yield accounts_model_1.default.findOne({ _id: accountId });
                if (!account) {
                    return {
                        status: false,
                        message: "No account was found for this request",
                    };
                }
                const previousPayment = yield wallet_incomingpayments_model_1.WalletIncomingPayments.findOne({
                    checkOutId: txRef,
                });
                if (previousPayment) {
                    return {
                        status: false,
                        message: "This transaction already has a payment.",
                    };
                }
                const debitWallet = yield wallet_model_1.Wallet.findOne({ user: account._id });
                if (!debitWallet) {
                    return {
                        status: false,
                        message: "No debit wallet was found...",
                    };
                }
                const creditWallet = yield wallet_model_1.Wallet.findOne({
                    user: merchantAccountId,
                    userType: "merchantAccounts",
                });
                if (!creditWallet) {
                    return {
                        status: false,
                        message: "No valid merchant was found...",
                    };
                }
                if (payloadHash) {
                    const otp = (0, helper_1.generateOtp)();
                    console.log("External Wallet Balance Payment OTP ", otp);
                    const key = `${accountId}:${payloadHash}`;
                    yield (0, helper_1.setExpirableCode)(key, "external-crygoca-balance-pay", otp);
                    yield wallet_externaltransactions_model_1.WalletExternalTransactions.findOneAndDelete({
                        txRef: payload.txRef,
                        status: "PENDING"
                    });
                    const transactionData = {
                        creditWallet: creditWallet._id,
                        debitWallet: debitWallet._id,
                        amount: payload.amount,
                        status: "PENDING",
                        txRef: payload.txRef,
                        currency: payload.currency,
                        convertedAmount: payload.convertedAmount,
                        app_fee: 0.0,
                        payment_type: "external-crygoca-wallet-balance",
                        authorized: false,
                        exchangeRate: payload.exchangeRate,
                        conversionPayload: payload.conversionPayload,
                        isConverted: payload.isConverted,
                        mode: payload.mode,
                        businessName: payload.businessName,
                        logo: payload.logo,
                        redirectUrl: payload.redirectUrl,
                    };
                    const walletExternalTransaction = yield wallet_externaltransactions_model_1.WalletExternalTransactions.create(transactionData);
                    /*Send otp to email */
                    mailservice_1.default.wallet.sendWalletPaymentAuthorizationPin(account.email, Number(otp), txRef, account);
                    return {
                        status: true,
                        message: "External Wallet Payment Authorization pin sent sucessfully",
                        data: walletExternalTransaction,
                    };
                }
                return {
                    status: false,
                    message: "Failed to send External Wallet Payment Authorization pin!",
                };
            }
            catch (error) {
                throw error;
            }
        });
    }
    static validateExternalWalletPaymentAuthorizationPin(accountId, paymentHash, authorizationPin, checkOutId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = `${accountId}:${paymentHash}`;
                const previousTransaction = yield wallet_externaltransactions_model_1.WalletExternalTransactions.findOne({
                    txRef: checkOutId,
                });
                if (previousTransaction && previousTransaction.status === "SUCCESS") {
                    return {
                        status: false,
                        message: "This transaction is already completed.",
                    };
                }
                if (authorizationPin) {
                    const cachedCode = yield (0, helper_1.getExpirableCode)("external-crygoca-balance-pay", key);
                    if (cachedCode) {
                        if ((cachedCode === null || cachedCode === void 0 ? void 0 : cachedCode.code) === authorizationPin) {
                            yield (0, helper_1.setExpirableCode)(key, "external-wallet-pay-authorization", "authorized", 120);
                            const walletExternalTransaction = yield wallet_externaltransactions_model_1.WalletExternalTransactions.findOneAndUpdate({
                                txRef: checkOutId,
                            }, { status: "AUTHORIZED", authorized: true }, { new: true }).populate("creditWallet").populate("debitWallet").exec();
                            return {
                                status: true,
                                message: "External Wallet payment request authorized",
                                data: walletExternalTransaction,
                            };
                        }
                    }
                    return {
                        status: false,
                        message: "External Wallet payment authorization failed, enter a valid authorization pin",
                    };
                }
                return {
                    status: false,
                    message: "No valid authorization pin was sent",
                };
            }
            catch (error) {
                throw error;
            }
        });
    }
    static getWithdrawalAuthorization(accountId, payloadHash) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const key = `${accountId}:${payloadHash}`;
                const withdrawalAuthorization = yield (0, helper_1.getExpirableCode)("withdrawal-authorization", key);
                if (withdrawalAuthorization &&
                    (withdrawalAuthorization === null || withdrawalAuthorization === void 0 ? void 0 : withdrawalAuthorization.code) === "authorized") {
                    return {
                        status: true,
                        message: "Withdrawal is authorized",
                        data: withdrawalAuthorization,
                    };
                }
                else {
                    return {
                        status: false,
                        message: "No withdrawal authorization found for this request, ensure to complete withdrawals immediately.",
                    };
                }
            }
            catch (error) {
                throw error;
            }
        });
    }
    static comparePayloadHashes(hash, payload) {
        // Convert the payload to a string
        const payloadString = JSON.stringify(payload);
        // Hash the string using SHA-256
        const hashedPayload = CryptoJS.SHA256(payloadString).toString(CryptoJS.enc.Hex);
        console.log("Comparing Payload hashes:", hash, hashedPayload);
        return hashedPayload === hash;
    }
}
exports.WalletAuthorization = WalletAuthorization;
