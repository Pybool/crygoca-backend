"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
exports.SmsService = void 0;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = require("dotenv");
const global_error_handler_1 = require("../../../bootstrap/global.error.handler");
(0, dotenv_1.config)();
(0, dotenv_1.config)({ path: `.env.${process.env.NODE_ENV}` });
const baseUrl = "https://v3.api.termii.com/api/sms/otp/send";
class SmsService {
    static sendSms(msgType, variable, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const messages = {
                REGISTER: `Welcome to GTR Raffle Draws! Your registration OTP is ${variable}. Please enter this code to complete your registration.`,
                LOGIN: `Your GTR Raffle Draws login OTP is ${variable}. Please enter this code to log in to your account.`,
                TICKETS: `Your GTR Ticket Numbers  for contest ${variable === null || variable === void 0 ? void 0 : variable.contestCode} are ${variable === null || variable === void 0 ? void 0 : variable.tickets}. Thank you!!`,
                WIN: `You have winning GTR Ticket Numbers  for contest ${variable === null || variable === void 0 ? void 0 : variable.contestCode} Tickets:( ${variable === null || variable === void 0 ? void 0 : variable.tickets} ). Contact us to claim your prizes now!!`
            };
            data["message_text"] = messages[msgType];
            return axios_1.default
                .post(baseUrl, data, {
                headers: {
                    "Content-Type": "application/json",
                },
            })
                .then((response) => {
                console.log("SMS sent successfully:", response.data);
                return response.data;
            })
                .catch((error) => {
                console.error("Error sending SMS:", error);
                return error === null || error === void 0 ? void 0 : error.message;
            });
        });
    }
}
exports.SmsService = SmsService;
__decorate([
    (0, global_error_handler_1.handleErrors)()
], SmsService, "sendSms", null);
