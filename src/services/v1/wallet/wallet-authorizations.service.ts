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
        if(process.env.MOCK_EXCHANGE_RATE==='true'){
          otp = "1234"
        }
        console.log("Transfers OTP ", otp);
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
          mailActions.wallet.sendTransferConfirmationOtp(
            clonedWallet.user.email,
            Number(otp)
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
        console.log("cachedCode", cachedCode);
        console.log("OTPS ", cachedCode?.code, transferIntent.otp)
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
        console.log("Withdrawal OTP ", otp);
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
        console.log("cachedCode", cachedCode);
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
