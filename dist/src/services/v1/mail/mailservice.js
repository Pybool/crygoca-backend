"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ejs_1 = __importDefault(require("ejs"));
const mailtrigger_1 = __importDefault(require("./mailtrigger"));
const dotenv_1 = require("dotenv");
const juice_1 = __importDefault(require("juice"));
(0, dotenv_1.config)();
const marketplaceUrl = process.env.CRYGOCA_FRONTEND_BASE_URL;
const mailActions = {
    auth: {
        sendEmailConfirmationOtp: async (subject, email, otp) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const template = await ejs_1.default.renderFile("src/templates/emailConfirmation.ejs", { email, otp, marketplaceUrl });
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: subject,
                        text: `Use the otp in this mail to complete your account onboarding`,
                        html: template,
                    };
                    (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            }).catch((error) => {
                console.log(error);
            });
        },
        sendAddPasswordMail: async (email, otp) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const template = await ejs_1.default.renderFile("src/templates/addPasswordTemplate.ejs", { otp, marketplaceUrl });
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Add Password",
                        text: `You have requested a password for your account.`,
                        html: template,
                    };
                    (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            }).catch((error) => {
                console.log(error);
            });
        },
        sendPasswordResetMail: async (email, otp) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const template = await ejs_1.default.renderFile("src/templates/resetPasswordTemplate.ejs", { otp, marketplaceUrl });
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Password Reset",
                        text: `You have requested a password reset.`,
                        html: template,
                    };
                    (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            }).catch((error) => {
                console.log(error);
            });
        },
    },
    orders: {
        sendBuyerOrderReceivedMail: async (email, data) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const template = await ejs_1.default.renderFile("src/templates/buyerPaymentSuccessTemplate.ejs", { data, marketplaceUrl });
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Order received",
                        text: `Your payment was successful and your order received.`,
                        html: template,
                    };
                    (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            }).catch((error) => {
                console.log(error);
            });
        },
        sendSellerOrderReceivedMail: async (email, data) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const template = await ejs_1.default.renderFile("src/templates/sellerPaymentSuccessTemplate.ejs", { data, marketplaceUrl });
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "New Order Placed",
                        text: `Your listing has a new order.`,
                        html: template,
                    };
                    (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            }).catch((error) => {
                console.log(error);
            });
        },
        sendOrderStatusUpdateMail: async (email, data) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const template = await ejs_1.default.renderFile("src/templates/orderStatusUpdateTemplate.ejs", { data, marketplaceUrl });
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Order Status Update",
                        text: `Your order status has been updated`,
                        html: template,
                    };
                    (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            }).catch((error) => {
                console.log(error);
            });
        },
        sendOrderAutoConfirmationWarningMail: async (email, data, accountId, timeout) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const disputeUrl = `${process.env.CRYGOCA_FRONTEND_BASE_URL}dispute-order/${data.checkOutId}/${accountId}`;
                    const template = await ejs_1.default.renderFile("src/templates/orderAutoConfirmWarnTemplate.ejs", { data, disputeUrl, timeout, marketplaceUrl });
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Auto-Confirmation",
                        text: `Imminent System Auto Confirmation!`,
                        html: template,
                    };
                    (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            }).catch((error) => {
                console.log(error);
            });
        },
        sendOrderAutoCompletionMail: async (email, data) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const template = await ejs_1.default.renderFile("src/templates/orderAutoConfirmedTemplate.ejs", { data, marketplaceUrl });
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Order Auto-Confirmed",
                        text: `Your order was auto Completed!`,
                        html: template,
                    };
                    (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            }).catch((error) => {
                console.log(error);
            });
        },
        sendBuyerLockedOrderMail: async (email, data) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const template = await ejs_1.default.renderFile("src/templates/buyerLockedOrderTemplate.ejs", { data, marketplaceUrl });
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Order Received",
                        text: `Your order was successful.`,
                        html: template,
                    };
                    (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            }).catch((error) => {
                console.log(error);
            });
        },
    },
    wallet: {
        sendCreditAlertMail: async (email, data) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const template = await ejs_1.default.renderFile("src/templates/creditAlertTemplate.ejs", { email, data, marketplaceUrl });
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Credit Alert!",
                        text: `Credit Alert 🎉`,
                        html: (0, juice_1.default)(template),
                    };
                    (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            }).catch((error) => {
                console.log(error);
            });
        },
        sendDebitAlertMail: async (email, data) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const template = await ejs_1.default.renderFile("src/templates/debitAlertTemplate.ejs", { email, data, marketplaceUrl });
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Debit Alert!",
                        text: `Debit alert`,
                        html: (0, juice_1.default)(template),
                    };
                    (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            }).catch((error) => {
                console.log(error);
            });
        },
        sendTransferConfirmationOtp: async (email, otp, data) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const template = await ejs_1.default.renderFile("src/templates/transferOtpTemplate.ejs", { email, otp, data, marketplaceUrl });
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Transfer OTP Code",
                        text: ``,
                        html: (0, juice_1.default)(template),
                    };
                    (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            }).catch((error) => {
                console.log(error);
            });
        },
        sendWithdrawalConfirmationOtp: async (email, otp) => {
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
                    (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            }).catch((error) => {
                console.log(error);
            });
        },
        sendWalletPaymentAuthorizationPin: async (email, otp, checkOutId, user) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const template = await ejs_1.default.renderFile("src/templates/walletPayAuthPinTemplate.ejs", { email, otp, user, checkOutId, marketplaceUrl });
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Wallet pay authorization Pin",
                        text: ``,
                        html: (0, juice_1.default)(template),
                    };
                    (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            }).catch((error) => {
                console.log(error);
            });
        },
        sendPaymentDebitAlertMail: async (email, data) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const template = await ejs_1.default.renderFile("src/templates/paymentDebitAlertTemplate.ejs", { email, data, marketplaceUrl });
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Payment Debit Alert!",
                        text: `Payment Debit alert`,
                        html: (0, juice_1.default)(template),
                    };
                    (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            }).catch((error) => {
                console.log(error);
            });
        },
        sendPendingIncomingPaymentMail: async (email, data) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const template = await ejs_1.default.renderFile("src/templates/pendingIncomingPaymentTemplate.ejs", { email, data, marketplaceUrl });
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Pending Incoming Payment!",
                        text: `Pending Incoming Payment⏱`,
                        html: (0, juice_1.default)(template),
                    };
                    (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            }).catch((error) => {
                console.log(error);
            });
        }
    },
    complaints: {
        sendComplaintReceivedMail: async (email, data) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const template = await ejs_1.default.renderFile("src/templates/complaintReceived.ejs", { data, marketplaceUrl });
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Complaint Received",
                        text: `Your complaint ${data.complaint.ticketNo} was received.`,
                        html: template,
                    };
                    (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            }).catch((error) => {
                console.log(error);
            });
        }
    },
    deposits: {
        sendDepositIntentMail: async (email, data) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const template = await ejs_1.default.renderFile("src/templates/depositIntentTemplate.ejs", { data, marketplaceUrl });
                    // console.log("Mail data ==> ", data);
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Listing Deposit",
                        text: `New Deposit Intent`,
                        html: template,
                    };
                    (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            }).catch((error) => {
                console.log(error);
            });
        },
        sendDepositSuccessMail: async (email, data) => {
            return new Promise(async (resolve, reject) => {
                try {
                    const template = await ejs_1.default.renderFile("src/templates/depositSuccessTemplate.ejs", { data, marketplaceUrl });
                    // console.log("Mail data ==> ", data);
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Blockchain Deposit Success",
                        text: `Deposit Success`,
                        html: template,
                    };
                    (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            }).catch((error) => {
                console.log(error);
            });
        }
    }
};
exports.default = mailActions;
