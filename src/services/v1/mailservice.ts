import Accounts from "../../models/accounts.model";
import * as crypto from "crypto";
import ejs from "ejs";
import sendMail from "./mailtrigger";
import { Options } from "nodemailer/lib/mailer";
import jwthelper from "../../helpers/jwt_helper";
import utils from "../../helpers/misc";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

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
  }
};

export default mailActions;
