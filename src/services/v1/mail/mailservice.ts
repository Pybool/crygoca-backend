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
import { IWalletIncomingPayments } from "../../../models/wallet-incomingpayments.model";
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

const marketplaceUrl: string = process.env.CRYGOCA_FRONTEND_BASE_URL!;

const mailActions = {
  auth: {
    sendEmailConfirmationOtp: async (subject:string, email: string, otp: string) => {
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
            subject: subject,
            text: `Use the otp in this mail to complete your account onboarding`,
            html: template,
          };
          sendMail(mailOptions);
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
          sendMail(mailOptions);
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
          sendMail(mailOptions);
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
          sendMail(mailOptions);
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
          sendMail(mailOptions);
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
          sendMail(mailOptions);
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
      timeout: string
    ) => {
      return new Promise(async (resolve, reject) => {
        try {
          const disputeUrl: string = `${process.env.CRYGOCA_FRONTEND_BASE_URL}dispute-order/${data.checkOutId}/${accountId}`;
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
          sendMail(mailOptions);
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
          sendMail(mailOptions);
          resolve({ status: true });
        } catch (error) {
          console.log(error);
          resolve({ status: false });
        }
      }).catch((error: any) => {
        console.log(error);
      });
    },

    sendBuyerLockedOrderMail: async (
      email: string,
      data: any
    ) => {
      return new Promise(async (resolve, reject) => {
        try {
          const template = await ejs.renderFile(
            "src/templates/buyerLockedOrderTemplate.ejs",
            { data, marketplaceUrl }
          );
          // console.log("Mail data ==> ", data);

          const mailOptions = {
            from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
            to: email,
            subject: "Order Received",
            text: `Your order was successful.`,
            html: template,
          };
          sendMail(mailOptions);
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
          sendMail(mailOptions);
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
          sendMail(mailOptions);
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
          sendMail(mailOptions);
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
          sendMail(mailOptions);
          resolve({ status: true });
        } catch (error) {
          console.log(error);
          resolve({ status: false });
        }
      }).catch((error: any) => {
        console.log(error);
      });
    },

    sendWalletPaymentAuthorizationPin: async (
      email: string,
      otp: number,
      checkOutId: string,
      user: any
    ) => {
      return new Promise(async (resolve, reject) => {
        try {
          const template = await ejs.renderFile(
            "src/templates/walletPayAuthPinTemplate.ejs",
            { email, otp, user, checkOutId, marketplaceUrl }
          );
          const mailOptions = {
            from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
            to: email,
            subject: "Wallet pay authorization Pin",
            text: ``,
            html: juice(template),
          };
          sendMail(mailOptions);
          resolve({ status: true });
        } catch (error) {
          console.log(error);
          resolve({ status: false });
        }
      }).catch((error: any) => {
        console.log(error);
      });
    },

    sendPaymentDebitAlertMail: async (
      email: string,
      data: { walletTransaction: IWalletTransaction; wallet: IWallet }
    ) => {
      return new Promise(async (resolve, reject) => {
        try {
          const template = await ejs.renderFile(
            "src/templates/paymentDebitAlertTemplate.ejs",
            { email, data, marketplaceUrl }
          );
          const mailOptions = {
            from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
            to: email,
            subject: "Payment Debit Alert!",
            text: `Payment Debit alert`,
            html: juice(template),
          };
          sendMail(mailOptions);
          resolve({ status: true });
        } catch (error) {
          console.log(error);
          resolve({ status: false });
        }
      }).catch((error: any) => {
        console.log(error);
      });
    },

    sendPendingIncomingPaymentMail: async (email:string, data:{
      walletIncomingPayment:IWalletIncomingPayments
      receiverWallet: IWallet,
    })=>{
      return new Promise(async (resolve, reject) => {
        try {
          const template = await ejs.renderFile(
            "src/templates/pendingIncomingPaymentTemplate.ejs",
            { email, data, marketplaceUrl }
          );
          const mailOptions = {
            from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
            to: email,
            subject: "Pending Incoming Payment!",
            text: `Pending Incoming Payment⏱`,
            html: juice(template),
          };
          sendMail(mailOptions);
          resolve({ status: true });
        } catch (error) {
          console.log(error);
          resolve({ status: false });
        }
      }).catch((error: any) => {
        console.log(error);
      });
    }
  },

  complaints:{
    sendComplaintReceivedMail: async (
      email: string,
      data: any
    ) => {
      return new Promise(async (resolve, reject) => {
        try {
          const template = await ejs.renderFile(
            "src/templates/complaintReceived.ejs",
            { data, marketplaceUrl }
          );
          // console.log("Mail data ==> ", data);

          const mailOptions = {
            from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
            to: email,
            subject: "Complaint Received",
            text: `Your complaint ${data.complaint.ticketNo} was received.`,
            html: template,
          };
          sendMail(mailOptions);
          resolve({ status: true });
        } catch (error) {
          console.log(error);
          resolve({ status: false });
        }
      }).catch((error: any) => {
        console.log(error);
      });
    }
  },

  deposits:{
    sendDepositIntentMail: async (
      email: string,
      data: any
    ) => {
      return new Promise(async (resolve, reject) => {
        try {
          const template = await ejs.renderFile(
            "src/templates/depositIntentTemplate.ejs",
            { data, marketplaceUrl }
          );
          // console.log("Mail data ==> ", data);

          const mailOptions = {
            from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
            to: email,
            subject: "Listing Deposit",
            text: `New Deposit Intent`,
            html: template,
          };
          sendMail(mailOptions);
          resolve({ status: true });
        } catch (error) {
          console.log(error);
          resolve({ status: false });
        }
      }).catch((error: any) => {
        console.log(error);
      });
    },

    sendDepositSuccessMail: async (
      email: string,
      data: any
    ) => {
      return new Promise(async (resolve, reject) => {
        try {
          const template = await ejs.renderFile(
            "src/templates/depositSuccessTemplate.ejs",
            { data, marketplaceUrl }
          );
          // console.log("Mail data ==> ", data);

          const mailOptions = {
            from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
            to: email,
            subject: "Blockchain Deposit Success",
            text: `Deposit Success`,
            html: template,
          };
          sendMail(mailOptions);
          resolve({ status: true });
        } catch (error) {
          console.log(error);
          resolve({ status: false });
        }
      }).catch((error: any) => {
        console.log(error);
      });
    }
  }
};

export default mailActions;
