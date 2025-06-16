"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
let transporter;
let sendMail;
try {
    transporter = nodemailer_1.default.createTransport({
        service: process.env.EMAIL_HOST,
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || "2525"),
        auth: {
            user: process.env.EMAIL_HOST_USER,
            pass: process.env.EMAIL_HOST_PASSWORD,
        },
        tls: { rejectUnauthorized: false }
    });
    sendMail = (mailOptions) => {
        return new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Email error:", error);
                    reject(error);
                }
                else {
                    console.log("Email sent:", info.response);
                    resolve(info);
                }
            });
        }).catch((error) => {
            console.log("Mail error: ", error);
        });
    };
}
catch {
    console.log("Error occured in mail");
}
exports.default = sendMail;
