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
const mailActions = {
    auth: {
        sendEmailConfirmationOtp: (email, otp) => __awaiter(void 0, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    const template = yield ejs_1.default.renderFile("src/templates/emailConfirmation.ejs", { email, otp });
                    const mailOptions = {
                        from: "info.crygoca@gmail.com",
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
                throw error;
            });
        }),
        sendPasswordResetMail: (email, user) => __awaiter(void 0, void 0, void 0, function* () {
            return { status: true, message: "" };
        }),
    }
};
exports.default = mailActions;
