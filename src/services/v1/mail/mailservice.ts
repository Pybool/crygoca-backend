import Accounts from "../../../models/accounts.model";
import * as crypto from "crypto";
import ejs from "ejs";
import sendMail from "./mailtrigger";
import { Options } from "nodemailer/lib/mailer";
import jwthelper from "../../../helpers/jwt_helper";
import utils from "../../../helpers/misc";
import { config as dotenvConfig } from "dotenv";
import { IWalletTransaction } from "../../../models/wallet-transaction.model";
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

const mailActions = {
  auth: {
    sendEmailConfirmationOtp: async (email: string, otp: string) => {
      return new Promise(async (resolve, reject) => {
        try {
          const template = await ejs.renderFile(
            "src/templates/emailConfirmation.ejs",
            { email, otp }
          );
          console.log("OTP==> ", otp);

          const mailOptions = {
            from: process.env.EMAIL_HOST_USER,
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

    sendPasswordResetMail: async (email: string, user: any) => {
      return { status: true, message: "" };
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
            { data }
          );
          console.log("Mail data ==> ", data);

          const mailOptions = {
            from: process.env.EMAIL_HOST_USER,
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
            { data }
          );
          console.log("Mail data ==> ", data);

          const mailOptions = {
            from: process.env.EMAIL_HOST_USER,
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
            { data }
          );
          console.log("Mail data ==> ", data);

          const mailOptions = {
            from: process.env.EMAIL_HOST_USER,
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
  },

  wallet: {
    sendCreditAlertMail: async (
      email: string,
      data: { walletTransaction: IWalletTransaction }
    ) => {
      return new Promise(async (resolve, reject) => {
        try {
          // const template = await ejs.renderFile(
          //   "src/templates/orderStatusUpdateTemplate.ejs",
          //   { email, otp }
          // );
          const mailOptions = {
            from: process.env.EMAIL_HOST_USER,
            to: email,
            subject: "Credit Alert!",
            text: `Credit alert ${data.walletTransaction.amount} on your wallet from ${data?.walletTransaction?.debitWalletAccountNo || data?.walletTransaction?.payout}`,
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

    sendDebitAlertMail: async (
      email: string,
      data: { walletTransaction: IWalletTransaction }
    ) => {
      return new Promise(async (resolve, reject) => {
        try {
          // const template = await ejs.renderFile(
          //   "src/templates/orderStatusUpdateTemplate.ejs",
          //   { email, otp }
          // );
          const mailOptions = {
            from: process.env.EMAIL_HOST_USER,
            to: email,
            subject: "Debit Alert!",
            text: `Debit alert ${data.walletTransaction.amount} on your wallet`,
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

    sendTransferConfirmationOtp: async (
      email: string,
      otp: number
    ) => {
      return new Promise(async (resolve, reject) => {
        try {
          // const template = await ejs.renderFile(
          //   "src/templates/orderStatusUpdateTemplate.ejs",
          //   { email, otp }
          // );
          const mailOptions = {
            from: process.env.EMAIL_HOST_USER,
            to: email,
            subject: "Transfer OTP Code",
            text: `Your transfer otp code is ${otp}`,
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

    sendWithdrawalConfirmationOtp: async (
      email: string,
      otp: number
    ) => {
      return new Promise(async (resolve, reject) => {
        try {
          // const template = await ejs.renderFile(
          //   "src/templates/orderStatusUpdateTemplate.ejs",
          //   { email, otp }
          // );
          const mailOptions = {
            from: process.env.EMAIL_HOST_USER,
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
