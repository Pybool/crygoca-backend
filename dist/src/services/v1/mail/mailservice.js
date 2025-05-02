"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ejs_1 = __importDefault(require("ejs"));
const mailtrigger_1 = __importDefault(require("./mailtrigger"));
const dotenv_1 = require("dotenv");
const juice_1 = __importDefault(require("juice"));
(0, dotenv_1.config)();
const marketplaceUrl = process.env.marketplaceUrl || process.env.CRYGOCA_FRONTEND_BASE_URL;
const mailActions = {
    auth: {
        sendEmailConfirmationOtp: (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const template = yield ejs_1.default.renderFile("src/templates/emailConfirmation.ejs", { email, otp, marketplaceUrl });
                    console.log("OTP==> ", otp);
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Confirm your registration",
                        text: `Use the otp in this mail to complete your account onboarding`,
                        html: template,
                    };
                    yield (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            })).catch((error) => {
                console.log(error);
            });
        }),
        sendAddPasswordMail: (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const template = yield ejs_1.default.renderFile("src/templates/addPasswordTemplate.ejs", { otp, marketplaceUrl });
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Add Password",
                        text: `You have requested a password for your account.`,
                        html: template,
                    };
                    yield (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            })).catch((error) => {
                console.log(error);
            });
        }),
        sendPasswordResetMail: (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const template = yield ejs_1.default.renderFile("src/templates/resetPasswordTemplate.ejs", { otp, marketplaceUrl });
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Password Reset",
                        text: `You have requested a password reset.`,
                        html: template,
                    };
                    yield (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            })).catch((error) => {
                console.log(error);
            });
        }),
    },
    orders: {
        sendBuyerOrderReceivedMail: (email, data) => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const template = yield ejs_1.default.renderFile("src/templates/buyerPaymentSuccessTemplate.ejs", { data, marketplaceUrl });
                    console.log("Mail data ==> ", data);
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Order received",
                        text: `Your payment was successful and your order received.`,
                        html: template,
                    };
                    yield (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            })).catch((error) => {
                console.log(error);
            });
        }),
        sendSellerOrderReceivedMail: (email, data) => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const template = yield ejs_1.default.renderFile("src/templates/sellerPaymentSuccessTemplate.ejs", { data, marketplaceUrl });
                    console.log("Mail data ==> ", data);
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "New Order Placed",
                        text: `Your listing has a new order.`,
                        html: template,
                    };
                    yield (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            })).catch((error) => {
                console.log(error);
            });
        }),
        sendOrderStatusUpdateMail: (email, data) => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const template = yield ejs_1.default.renderFile("src/templates/orderStatusUpdateTemplate.ejs", { data, marketplaceUrl });
                    console.log("Mail data ==> ", data);
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Order Status Update",
                        text: `Your order status has been updated`,
                        html: template,
                    };
                    yield (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            })).catch((error) => {
                console.log(error);
            });
        }),
        sendOrderAutoConfirmationWarningMail: (email, data, accountId, timeout) => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const disputeUrl = `${process.env.CRYGOCA_FRONTEND_BASE_URL}//dispute-order/${data.checkOutId}/${accountId}`;
                    const template = yield ejs_1.default.renderFile("src/templates/orderAutoConfirmWarnTemplate.ejs", { data, disputeUrl, timeout, marketplaceUrl });
                    console.log("Mail data ==> ", data);
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Auto-Confirmation",
                        text: `Imminent System Auto Confirmation!`,
                        html: template,
                    };
                    yield (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            })).catch((error) => {
                console.log(error);
            });
        }),
        sendOrderAutoCompletionMail: (email, data) => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const template = yield ejs_1.default.renderFile("src/templates/orderAutoConfirmedTemplate.ejs", { data, marketplaceUrl });
                    console.log("Mail data ==> ", data);
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Order Auto-Confirmed",
                        text: `Your order was auto Completed!`,
                        html: template,
                    };
                    yield (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            })).catch((error) => {
                console.log(error);
            });
        }),
    },
    wallet: {
        sendCreditAlertMail: (email, data) => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const template = yield ejs_1.default.renderFile("src/templates/creditAlertTemplate.ejs", { email, data, marketplaceUrl });
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Credit Alert!",
                        text: `Credit Alert 🎉`,
                        html: (0, juice_1.default)(template),
                    };
                    yield (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            })).catch((error) => {
                console.log(error);
            });
        }),
        sendDebitAlertMail: (email, data) => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const template = yield ejs_1.default.renderFile("src/templates/debitAlertTemplate.ejs", { email, data, marketplaceUrl });
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Debit Alert!",
                        text: `Debit alert`,
                        html: (0, juice_1.default)(template),
                    };
                    yield (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            })).catch((error) => {
                console.log(error);
            });
        }),
        sendTransferConfirmationOtp: (email, otp, data) => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const template = yield ejs_1.default.renderFile("src/templates/transferOtpTemplate.ejs", { email, otp, data, marketplaceUrl });
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Transfer OTP Code",
                        text: ``,
                        html: (0, juice_1.default)(template),
                    };
                    yield (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            })).catch((error) => {
                console.log(error);
            });
        }),
        sendWithdrawalConfirmationOtp: (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
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
                    yield (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            })).catch((error) => {
                console.log(error);
            });
        }),
        sendWalletPaymentAuthorizationPin: (email, otp, checkOutId, user) => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const template = yield ejs_1.default.renderFile("src/templates/walletPayAuthPinTemplate.ejs", { email, otp, user, checkOutId, marketplaceUrl });
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Wallet pay authorization Pin",
                        text: ``,
                        html: (0, juice_1.default)(template),
                    };
                    yield (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            })).catch((error) => {
                console.log(error);
            });
        }),
        sendPaymentDebitAlertMail: (email, data) => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const template = yield ejs_1.default.renderFile("src/templates/paymentDebitAlertTemplate.ejs", { email, data, marketplaceUrl });
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Payment Debit Alert!",
                        text: `Payment Debit alert`,
                        html: (0, juice_1.default)(template),
                    };
                    yield (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            })).catch((error) => {
                console.log(error);
            });
        }),
        sendPendingIncomingPaymentMail: (email, data) => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const template = yield ejs_1.default.renderFile("src/templates/pendingIncomingPaymentTemplate.ejs", { email, data, marketplaceUrl });
                    const mailOptions = {
                        from: `"Crygoca" <${process.env.EMAIL_HOST_USER}>`,
                        to: email,
                        subject: "Pending Incoming Payment!",
                        text: `Pending Incoming Payment⏱`,
                        html: (0, juice_1.default)(template),
                    };
                    yield (0, mailtrigger_1.default)(mailOptions);
                    resolve({ status: true });
                }
                catch (error) {
                    console.log(error);
                    resolve({ status: false });
                }
            })).catch((error) => {
                console.log(error);
            });
        })
    },
};
exports.default = mailActions;
