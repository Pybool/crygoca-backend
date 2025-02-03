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
(0, dotenv_1.config)();
const mailActions = {
    auth: {
        sendEmailConfirmationOtp: (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const template = yield ejs_1.default.renderFile("src/templates/emailConfirmation.ejs", { email, otp });
                    console.log("OTP==> ", otp);
                    const mailOptions = {
                        from: process.env.EMAIL_HOST_USER,
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
        sendPasswordResetMail: (email, user) => __awaiter(void 0, void 0, void 0, function* () {
            return { status: true, message: "" };
        }),
    },
    orders: {
        sendBuyerOrderReceivedMail: (email, data) => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const template = yield ejs_1.default.renderFile("src/templates/buyerPaymentSuccessTemplate.ejs", { data });
                    console.log("Mail data ==> ", data);
                    const mailOptions = {
                        from: process.env.EMAIL_HOST_USER,
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
                    const template = yield ejs_1.default.renderFile("src/templates/sellerPaymentSuccessTemplate.ejs", { data });
                    console.log("Mail data ==> ", data);
                    const mailOptions = {
                        from: process.env.EMAIL_HOST_USER,
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
                    const template = yield ejs_1.default.renderFile("src/templates/orderStatusUpdateTemplate.ejs", { data });
                    console.log("Mail data ==> ", data);
                    const mailOptions = {
                        from: process.env.EMAIL_HOST_USER,
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
    },
    wallet: {
        sendCreditAlertMail: (email, data) => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                var _a, _b;
                try {
                    // const template = await ejs.renderFile(
                    //   "src/templates/orderStatusUpdateTemplate.ejs",
                    //   { email, otp }
                    // );
                    const mailOptions = {
                        from: process.env.EMAIL_HOST_USER,
                        to: email,
                        subject: "Credit Alert!",
                        text: `Credit alert ${data.walletTransaction.amount} on your wallet from ${((_a = data === null || data === void 0 ? void 0 : data.walletTransaction) === null || _a === void 0 ? void 0 : _a.debitWalletAccountNo) || ((_b = data === null || data === void 0 ? void 0 : data.walletTransaction) === null || _b === void 0 ? void 0 : _b.payout)}`,
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
        sendDebitAlertMail: (email, data) => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
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
        sendTransferConfirmationOtp: (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
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
                        from: process.env.EMAIL_HOST_USER,
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
    },
};
exports.default = mailActions;
