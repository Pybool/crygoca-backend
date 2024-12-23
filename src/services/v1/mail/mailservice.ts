import Accounts from "../../../models/accounts.model";
import * as crypto from "crypto";
import ejs from "ejs";
import sendMail from "./mailtrigger";
import { Options } from "nodemailer/lib/mailer";
import jwthelper from "../../../helpers/jwt_helper";
import utils from "../../../helpers/misc";
import { config as dotenvConfig } from "dotenv";
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
  buyerUserName?:string;
  paymentOption: string;
  date: Date | string;
  status?:string;
}


const mailActions = {
  auth: {
    sendEmailConfirmationOtp: async (email:string, otp:string) => {
      return new Promise(async (resolve, reject) => {
        try {
          const template = await ejs.renderFile(
            "src/templates/emailConfirmation.ejs",
            { email, otp }
          );
          console.log("OTP==> ", otp)

          const mailOptions = {
            from: process.env.EMAIL_HOST_USER,
            to: email,
            subject: "Confirm your registration",
            text: `Use the otp in this mail to complete your account onboarding`,
            html: template,
          };
          await sendMail(mailOptions);
          resolve({ status: true });
        } catch(error){
          console.log(error)
          resolve({ status: false });
        }
      }).catch((error:any)=>{
        console.log(error)
        throw error
      });
    },

    sendPasswordResetMail: async (email: string, user: any) => {
      return { status: true, message: "" };
    },
  },
  orders:{
    sendBuyerOrderReceivedMail: async (email:string, data:IEmailCheckoutData) => {
      return new Promise(async (resolve, reject) => {
        try {
          const template = await ejs.renderFile(
            "src/templates/buyerPaymentSuccessTemplate.ejs",
            { data }
          );
          console.log("Mail data ==> ", data)

          const mailOptions = {
            from: process.env.EMAIL_HOST_USER,
            to: email,
            subject: "Order received",
            text: `Your payment was successful and your order received.`,
            html: template,
          };
          await sendMail(mailOptions);
          resolve({ status: true });
        } catch(error){
          console.log(error)
          resolve({ status: false });
        }
      }).catch((error:any)=>{
        console.log(error)
        throw error
      });
    },
    
    sendSellerOrderReceivedMail: async (email:string, data:IEmailCheckoutData) => {
      return new Promise(async (resolve, reject) => {
        try {
          const template = await ejs.renderFile(
            "src/templates/sellerPaymentSuccessTemplate.ejs",
            { data }
          );
          console.log("Mail data ==> ", data)

          const mailOptions = {
            from: process.env.EMAIL_HOST_USER,
            to: email,
            subject: "New Order Placed",
            text: `Your listing has a new order.`,
            html: template,
          };
          await sendMail(mailOptions);
          resolve({ status: true });
        } catch(error){
          console.log(error)
          resolve({ status: false });
        }
      }).catch((error:any)=>{
        console.log(error)
        throw error
      });
    },

    sendOrderStatusUpdateMail: async (email:string, data:IEmailCheckoutData) => {
      return new Promise(async (resolve, reject) => {
        try {
          const template = await ejs.renderFile(
            "src/templates/orderStatusUpdateTemplate.ejs",
            { data }
          );
          console.log("Mail data ==> ", data)

          const mailOptions = {
            from: process.env.EMAIL_HOST_USER,
            to: email,
            subject: "Order Status Update",
            text: `Your order status has been updated`,
            html: template,
          };
          await sendMail(mailOptions);
          resolve({ status: true });
        } catch(error){
          console.log(error)
          resolve({ status: false });
        }
      }).catch((error:any)=>{
        console.log(error)
        throw error
      });
    },
  }
};

export default mailActions;
