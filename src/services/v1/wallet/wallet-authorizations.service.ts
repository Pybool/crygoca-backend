import mongoose from "mongoose";
import {
  IuserDetails,
  IWalletTransaction,
  WalletTransaction,
} from "../../../models/wallet-transaction.model";
import { IWallet, Wallet } from "../../../models/wallet.model";
import Accounts from "../../../models/accounts.model";
import { NotificationModel } from "../../../models/notifications.model";
import mailActions from "../mail/mailservice";
import {
  generateOtp,
  getExpirableCode,
  setExpirableCode,
} from "../auth/helper";
import {
  IWalletBeneficiary,
  WalletBeneficiary,
} from "../../../models/wallet-beneficiaries.model";
import Xrequest from "../../../interfaces/extensions.interface";
import { WalletService } from "./wallet.service";
import * as CryptoJS from "crypto-js";
import CryptoListingPurchase from "../../../models/listingPurchase.model";
import { WalletIncomingPayments } from "../../../models/wallet-incomingpayments.model";
import {
  IWalletExternalTransaction,
  WalletExternalTransactions,
} from "../../../models/wallet-externaltransactions.model";
import MerchantCredentials from "../../../models/merchant-credentials.model";

//For Payout topup and direct topups
export interface ItopUps {
  walletAccountNo: string;
  operationType: string;
  payoutId?: mongoose.Types.ObjectId;
  payoutConversionMetrics?: any;
  verifiedTransactionId?: mongoose.Types.ObjectId;
}

export class WalletAuthorization {
  public static async sendTransferOtp(transferIntent: {
    walletToDebit: string;
    walletToCredit: string;
    amount: string;
    user: any;
  }) {
    try {
      if (transferIntent) {
        let debitWalletResponse: {
          status: boolean;
          message: string;
          wallet?: IWallet;
        } = await WalletService.getReceipientWallet(
          transferIntent.walletToDebit
        );
        let creditWalletResponse: {
          status: boolean;
          message: string;
          wallet?: IWallet;
        } = await WalletService.getReceipientWallet(
          transferIntent.walletToCredit
        );
        if (!debitWalletResponse.wallet || !creditWalletResponse.wallet) {
          return {
            status: false,
            message: "Creditor/Debitor was not found for this request",
          };
        }
        let otp: string = generateOtp();
        if (process.env.MOCK_EXCHANGE_RATE === "true") {
          otp = "1234";
        }
        let clonedWallet = JSON.parse(
          JSON.stringify(debitWalletResponse.wallet)
        );
        await setExpirableCode(
          `${transferIntent.walletToDebit}:${transferIntent.walletToCredit}`,
          "transfers-otp",
          otp
        );
        /*Send otp to email */
        if (clonedWallet.user.useTransferOtpEmail) {
          transferIntent.user = clonedWallet.user;
          mailActions.wallet.sendTransferConfirmationOtp(
            clonedWallet.user.email,
            Number(otp),
            transferIntent
          );
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
    } catch (error: any) {
      throw error;
    }
  }

  public static async verifyTransferOtp(transferIntent: {
    walletToDebit: string;
    walletToCredit: string;
    otp: string;
  }) {
    try {
      if (transferIntent) {
        let debitWalletResponse: {
          status: boolean;
          message: string;
          wallet?: IWallet;
        } = await WalletService.getReceipientWallet(
          transferIntent.walletToDebit
        );
        let creditWalletResponse: {
          status: boolean;
          message: string;
          wallet?: IWallet;
        } = await WalletService.getReceipientWallet(
          transferIntent.walletToCredit
        );
        if (!debitWalletResponse.wallet || !creditWalletResponse.wallet) {
          return {
            status: false,
            message: "Creditor/Debitor was not found for this request",
          };
        }
        const cachedCode: any = await getExpirableCode(
          "transfers-otp",
          `${transferIntent.walletToDebit}:${transferIntent.walletToCredit}`
        );
        if (cachedCode) {
          if (cachedCode?.code === transferIntent.otp) {
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
    } catch (error: any) {
      throw error;
    }
  }

  public static async sendWithdrawalOtp(
    accountId: string,
    payloadHash: string
  ) {
    try {
      const account: any = await Accounts.findOne({ _id: accountId });
      if (!account) {
        return {
          status: false,
          message: "No account was found for this request",
        };
      }
      if (payloadHash) {
        const otp: string = generateOtp();
        const key: string = `${accountId}:${payloadHash}`;

        await setExpirableCode(key, "withdrawal-otp", otp);
        /*Send otp to email */
        if (account.useTransferOtpEmail) {
          mailActions.wallet.sendWithdrawalConfirmationOtp(
            account.email,
            Number(otp)
          );
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
    } catch (error: any) {
      throw error;
    }
  }

  public static async verifyWithdrawalOtp(withdrawalIntent: {
    accountId?: string;
    payloadHash: string;
    otp: string;
  }) {
    try {
      const key: string = `${withdrawalIntent.accountId}:${withdrawalIntent.payloadHash}`;
      if (withdrawalIntent) {
        const cachedCode: any = await getExpirableCode("withdrawal-otp", key);
        if (cachedCode) {
          if (cachedCode?.code === withdrawalIntent.otp) {
            await setExpirableCode(
              key,
              "withdrawal-authorization",
              "authorized",
              120
            );
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
    } catch (error: any) {
      throw error;
    }
  }

  public static async sendWalletPaymentAuthorizationPin(
    accountId: string,
    payloadHash: string,
    checkOutId: string
  ) {
    try {
      const account: any = await Accounts.findOne({ _id: accountId });
      if (!account) {
        return {
          status: false,
          message: "No account was found for this request",
        };
      }
      const previousPayment = await WalletIncomingPayments.findOne({
        checkOutId: checkOutId,
      });
      if (previousPayment) {
        return {
          status: false,
          message: "This transaction already has a payment.",
        };
      }
      if (payloadHash) {
        const otp: string = generateOtp();
        console.log("Wallet Balance Payment OTP ", otp);
        const key: string = `${accountId}:${payloadHash}`;

        await setExpirableCode(key, "crygoca-balance-pay", otp);
        /*Send otp to email */
        mailActions.wallet.sendWalletPaymentAuthorizationPin(
          account.email,
          Number(otp),
          checkOutId,
          account
        );
        return {
          status: true,
          message: "Wallet Payment Authorization pin sent sucessfully",
        };
      }
      return {
        status: false,
        message: "Failed to send Wallet Payment Authorization pin!",
      };
    } catch (error: any) {
      throw error;
    }
  }

  public static async validateWalletPaymentAuthorizationPin(
    accountId: string,
    paymentHash: string,
    authorizationPin: string,
    checkOutId: string,
    isExternal: boolean = false
  ) {
    try {
      const key: string = `${accountId}:${paymentHash}`;
      const previousPayment = await WalletIncomingPayments.findOne({
        checkOutId: checkOutId,
      });
      if (previousPayment) {
        return {
          status: false,
          message: "This transaction already has a payment.",
        };
      }

      if (!isExternal) {
        const purchaseIntent = await CryptoListingPurchase.findOne({
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
        const cachedCode: any = await getExpirableCode(
          "crygoca-balance-pay",
          key
        );
        console.log("cachedCodeAuthPin", cachedCode);
        if (cachedCode) {
          if (cachedCode?.code === authorizationPin) {
            await setExpirableCode(
              key,
              "wallet-pay-authorization",
              "authorized",
              120
            );
            return {
              status: true,
              message: "Wallet payment request authorized",
            };
          }
        }
        return {
          status: false,
          message:
            "Wallet payment authorization failed, enter a valid authorization pin",
        };
      }

      return {
        status: false,
        message: "No valid authorization pin was sent",
      };
    } catch (error: any) {
      throw error;
    }
  }

  public static async sendExternalWalletPaymentAuthorizationPin(payload: any) {
    try {
      const payloadHash: string = payload.payloadHash!;
      const txRef: string = payload.txRef!;
      const accountId: string = payload.accountId! as string;
      const merchantCredentials: any = payload.merchantCredentials;
      const merchantCredentialsDb = await MerchantCredentials.findOne({
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
      const merchantAccountId: string =
        merchantCredentialsDb.account.toString();

      const account: any = await Accounts.findOne({ _id: accountId });
      if (!account) {
        return {
          status: false,
          message: "No account was found for this request",
        };
      }
      const previousPayment = await WalletIncomingPayments.findOne({
        checkOutId: txRef,
      });
      if (previousPayment) {
        return {
          status: false,
          message: "This transaction already has a payment.",
        };
      }
      const debitWallet = await Wallet.findOne({ user: account._id });
      if (!debitWallet) {
        return {
          status: false,
          message: "No debit wallet was found...",
        };
      }

      const creditWallet = await Wallet.findOne({
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
        const otp: string = generateOtp();
        console.log("External Wallet Balance Payment OTP ", otp);
        const key: string = `${accountId}:${payloadHash}`;

        await setExpirableCode(key, "external-crygoca-balance-pay", otp);
        await WalletExternalTransactions.findOneAndDelete({
          txRef: payload.txRef,
          status: "PENDING"
        });        
        const transactionData: IWalletExternalTransaction = {
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
        const walletExternalTransaction =
          await WalletExternalTransactions.create(transactionData);
        /*Send otp to email */
        mailActions.wallet.sendWalletPaymentAuthorizationPin(
          account.email,
          Number(otp),
          txRef,
          account
        );
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
    } catch (error: any) {
      throw error;
    }
  }

  public static async validateExternalWalletPaymentAuthorizationPin(
    accountId: string,
    paymentHash: string,
    authorizationPin: string,
    checkOutId: string
  ) {
    try {
      const key: string = `${accountId}:${paymentHash}`;
      const previousTransaction = await WalletExternalTransactions.findOne({
        txRef: checkOutId,
      });
      if (previousTransaction && previousTransaction.status === "SUCCESS") {
        return {
          status: false,
          message: "This transaction is already completed.",
        };
      }

      if (authorizationPin) {
        const cachedCode: any = await getExpirableCode(
          "external-crygoca-balance-pay",
          key
        );
        if (cachedCode) {
          if (cachedCode?.code === authorizationPin) {
            await setExpirableCode(
              key,
              "external-wallet-pay-authorization",
              "authorized",
              120
            );
            const walletExternalTransaction =
              await WalletExternalTransactions.findOneAndUpdate(
                {
                  txRef: checkOutId,
                },
                { status: "AUTHORIZED", authorized: true },
                { new: true }
              ).populate("creditWallet").populate("debitWallet").exec();
            return {
              status: true,
              message: "External Wallet payment request authorized",
              data: walletExternalTransaction,
            };
          }
        }
        return {
          status: false,
          message:
            "External Wallet payment authorization failed, enter a valid authorization pin",
        };
      }

      return {
        status: false,
        message: "No valid authorization pin was sent",
      };
    } catch (error: any) {
      throw error;
    }
  }

  public static async getWithdrawalAuthorization(
    accountId: string,
    payloadHash: string
  ) {
    try {
      const key: string = `${accountId}:${payloadHash}`;
      const withdrawalAuthorization = await getExpirableCode(
        "withdrawal-authorization",
        key
      );
      if (
        withdrawalAuthorization &&
        withdrawalAuthorization?.code === "authorized"
      ) {
        return {
          status: true,
          message: "Withdrawal is authorized",
          data: withdrawalAuthorization,
        };
      } else {
        return {
          status: false,
          message:
            "No withdrawal authorization found for this request, ensure to complete withdrawals immediately.",
        };
      }
    } catch (error: any) {
      throw error;
    }
  }

  public static comparePayloadHashes(hash: string, payload: any) {
    // Convert the payload to a string
    const payloadString = JSON.stringify(payload);

    // Hash the string using SHA-256
    const hashedPayload = CryptoJS.SHA256(payloadString).toString(
      CryptoJS.enc.Hex
    );

    console.log("Comparing Payload hashes:", hash, hashedPayload);
    return hashedPayload === hash;
  }
}
