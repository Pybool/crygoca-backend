import Accounts from "../../../models/accounts.model";
import * as crypto from "crypto";
import ejs from "ejs";
import sendMail from "./mailtrigger";
import { Options } from "nodemailer/lib/mailer";
import jwthelper from "../../../helpers/jwt_helper";
import utils from "../../../helpers/misc";
import { config as dotenvConfig } from "dotenv";
import { IWalletTransaction } from "../../../models/wallet-transaction.model";
import juice from "juice";
import { IWallet } from "../../../models/wallet.model";
dotenvConfig();

export interface IEmailCheckoutData {
  checkOutId: string;
  cryptoName: string;
  cryptoCode: string;
  cryptoLogo: string;
  units: number;
  currency: string;
  amount: number;
  walletAddress: string;
  sellerUserName?: string;
  buyerUserName?: string;
  paymentOption: string;
  date: Date | string;
  status?: string;
}

const marketplaceUrl:string = process.env.marketplaceUrl! || process.env.CRYGOCA_FRONTEND_BASE_URL!;

const mailActions = {
  auth: {
    sendEmailConfirmationOtp: async (email: string, otp: string) => {
      return new Promise(async (resolve, reject) => {
        try {
          const template = await ejs.renderFile(
            "src/templates/emailConfirmation.ejs",
            { email, otp, marketplaceUrl }
          );
          console.log("OTP==> ", otp);

          const mailOptions = {
            from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
            to: email,
            subject: "Confirm your registration",
            text: `Use the otp in this mail to complete your account onboarding`,
            html: template,
          };
          await sendMail(mailOptions);
          resolve({ status: true });
        } catch (error) {
          console.log(error);
          resolve({ status: false });
        }
      }).catch((error: any) => {
        console.log(error);
      });
    },

    sendAddPasswordMail: async (email: string, otp: any) => {
      return new Promise(async (resolve, reject) => {
        try {
          const template = await ejs.renderFile(
            "src/templates/addPasswordTemplate.ejs",
            { otp, marketplaceUrl }
          );
          const mailOptions = {
            from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
            to: email,
            subject: "Add Password",
            text: `You have requested a password for your account.`,
            html: template,
          };
          await sendMail(mailOptions);
          resolve({ status: true });
        } catch (error) {
          console.log(error);
          resolve({ status: false });
        }
      }).catch((error: any) => {
        console.log(error);
      });
    },

    sendPasswordResetMail: async (email: string, otp: any) => {
      return new Promise(async (resolve, reject) => {
        try {
          const template = await ejs.renderFile(
            "src/templates/resetPasswordTemplate.ejs",
            { otp, marketplaceUrl }
          );
          const mailOptions = {
            from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
            to: email,
            subject: "Password Reset",
            text: `You have requested a password reset.`,
            html: template,
          };
          await sendMail(mailOptions);
          resolve({ status: true });
        } catch (error) {
          console.log(error);
          resolve({ status: false });
        }
      }).catch((error: any) => {
        console.log(error);
      });
    },
  },
  orders: {
    sendBuyerOrderReceivedMail: async (
      email: string,
      data: IEmailCheckoutData
    ) => {
      return new Promise(async (resolve, reject) => {
        try {
          const template = await ejs.renderFile(
            "src/templates/buyerPaymentSuccessTemplate.ejs",
            { data, marketplaceUrl }
          );
          console.log("Mail data ==> ", data);

          const mailOptions = {
            from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
            to: email,
            subject: "Order received",
            text: `Your payment was successful and your order received.`,
            html: template,
          };
          await sendMail(mailOptions);
          resolve({ status: true });
        } catch (error) {
          console.log(error);
          resolve({ status: false });
        }
      }).catch((error: any) => {
        console.log(error);
      });
    },

    sendSellerOrderReceivedMail: async (
      email: string,
      data: IEmailCheckoutData
    ) => {
      return new Promise(async (resolve, reject) => {
        try {
          const template = await ejs.renderFile(
            "src/templates/sellerPaymentSuccessTemplate.ejs",
            { data, marketplaceUrl }
          );
          console.log("Mail data ==> ", data);

          const mailOptions = {
            from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
            to: email,
            subject: "New Order Placed",
            text: `Your listing has a new order.`,
            html: template,
          };
          await sendMail(mailOptions);
          resolve({ status: true });
        } catch (error) {
          console.log(error);
          resolve({ status: false });
        }
      }).catch((error: any) => {
        console.log(error);
      });
    },

    sendOrderStatusUpdateMail: async (
      email: string,
      data: IEmailCheckoutData
    ) => {
      return new Promise(async (resolve, reject) => {
        try {
          const template = await ejs.renderFile(
            "src/templates/orderStatusUpdateTemplate.ejs",
            { data, marketplaceUrl }
          );
          console.log("Mail data ==> ", data);

          const mailOptions = {
            from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
            to: email,
            subject: "Order Status Update",
            text: `Your order status has been updated`,
            html: template,
          };
          await sendMail(mailOptions);
          resolve({ status: true });
        } catch (error) {
          console.log(error);
          resolve({ status: false });
        }
      }).catch((error: any) => {
        console.log(error);
      });
    },

    sendOrderAutoConfirmationWarningMail: async (
      email: string,
      data: IEmailCheckoutData,
      accountId: string,
      timeout:string
    ) => {
      return new Promise(async (resolve, reject) => {
        try {
          const disputeUrl: string = `${process.env.CRYGOCA_FRONTEND_BASE_URL}/marketplace/dispute-order/${data.checkOutId}/${accountId}`;
          const template = await ejs.renderFile(
            "src/templates/orderAutoConfirmWarnTemplate.ejs",
            { data, disputeUrl, timeout, marketplaceUrl }
          );
          console.log("Mail data ==> ", data);

          const mailOptions = {
            from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
            to: email,
            subject: "Auto-Confirmation",
            text: `Imminent System Auto Confirmation!`,
            html: template,
          };
          await sendMail(mailOptions);
          resolve({ status: true });
        } catch (error) {
          console.log(error);
          resolve({ status: false });
        }
      }).catch((error: any) => {
        console.log(error);
      });
    },

    sendOrderAutoCompletionMail: async (
      email: string,
      data: IEmailCheckoutData
    ) => {
      return new Promise(async (resolve, reject) => {
        try {
          const template = await ejs.renderFile(
            "src/templates/orderAutoConfirmedTemplate.ejs",
            { data, marketplaceUrl }
          );
          console.log("Mail data ==> ", data);

          const mailOptions = {
            from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
            to: email,
            subject: "Order Auto-Confirmed",
            text: `Your order was auto Completed!`,
            html: template,
          };
          await sendMail(mailOptions);
          resolve({ status: true });
        } catch (error) {
          console.log(error);
          resolve({ status: false });
        }
      }).catch((error: any) => {
        console.log(error);
      });
    },
  },

  wallet: {
    sendCreditAlertMail: async (
      email: string,
      data: { walletTransaction: IWalletTransaction; wallet: IWallet }
    ) => {
      return new Promise(async (resolve, reject) => {
        try {
          const template = await ejs.renderFile(
            "src/templates/creditAlertTemplate.ejs",
            { email, data, marketplaceUrl }
          );
          const mailOptions = {
            from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
            to: email,
            subject: "Credit Alert!",
            text: `Credit Alert 🎉`,
            html: juice(template),
          };
          await sendMail(mailOptions);
          resolve({ status: true });
        } catch (error) {
          console.log(error);
          resolve({ status: false });
        }
      }).catch((error: any) => {
        console.log(error);
      });
    },

    sendDebitAlertMail: async (
      email: string,
      data: { walletTransaction: IWalletTransaction; wallet: IWallet }
    ) => {
      return new Promise(async (resolve, reject) => {
        try {
          const template = await ejs.renderFile(
            "src/templates/debitAlertTemplate.ejs",
            { email, data, marketplaceUrl }
          );
          const mailOptions = {
            from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
            to: email,
            subject: "Debit Alert!",
            text: `Debit alert`,
            html: juice(template),
          };
          await sendMail(mailOptions);
          resolve({ status: true });
        } catch (error) {
          console.log(error);
          resolve({ status: false });
        }
      }).catch((error: any) => {
        console.log(error);
      });
    },

    sendTransferConfirmationOtp: async (
      email: string,
      otp: number,
      data: {
        walletToCredit: string;
        walletToDebit: string;
        amount: string;
        user: any;
      }
    ) => {
      return new Promise(async (resolve, reject) => {
        try {
          const template = await ejs.renderFile(
            "src/templates/transferOtpTemplate.ejs",
            { email, otp, data, marketplaceUrl }
          );
          const mailOptions = {
            from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
            to: email,
            subject: "Transfer OTP Code",
            text: ``,
            html: juice(template),
          };
          await sendMail(mailOptions);
          resolve({ status: true });
        } catch (error) {
          console.log(error);
          resolve({ status: false });
        }
      }).catch((error: any) => {
        console.log(error);
      });
    },

    sendWithdrawalConfirmationOtp: async (email: string, otp: number) => {
      return new Promise(async (resolve, reject) => {
        try {
          // const template = await ejs.renderFile(
          //   "src/templates/orderStatusUpdateTemplate.ejs",
          //   { email, otp }
          // );
          const mailOptions = {
            from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
            to: email,
            subject: "Withdrawal OTP Code",
            text: `Your withdrawal otp code is ${otp}`,
            html: "",
          };
          await sendMail(mailOptions);
          resolve({ status: true });
        } catch (error) {
          console.log(error);
          resolve({ status: false });
        }
      }).catch((error: any) => {
        console.log(error);
      });
    },
  },
};

export default mailActions;
