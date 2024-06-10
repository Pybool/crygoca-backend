import nodemailer from "nodemailer";
import { Options } from "nodemailer/lib/mailer";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();
let transporter:any;
let sendMail:any;

try {
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_HOST,
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || "2525"),
    auth: {
      user: process.env.EMAIL_HOST_USER,
      pass: process.env.EMAIL_HOST_PASSWORD,
    },
    tls : { rejectUnauthorized: false }
  });

  sendMail = (mailOptions: Options) => {
    return new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error: any, info: any) => {
        if (error) {
          console.error("Email error:", error);
          reject(error);
        } else {
          console.log("Email sent:", info.response);
          resolve(info);
        }
      });
    }).catch((error:any)=>{
      console.log("Mail error: ",error)
    });
  };
} catch {console.log("Error occured in mail")}

export default sendMail;
