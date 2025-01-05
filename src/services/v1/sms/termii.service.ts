import axios from "axios";
import { config as dotenvConfig } from "dotenv";
import { handleErrors } from "../../../bootstrap/global.error.handler";

dotenvConfig();
dotenvConfig({ path: `.env.${process.env.NODE_ENV}` });
const baseUrl = "https://v3.api.termii.com/api/sms/otp/send";

export class SmsService {
  @handleErrors()
  static async sendSms(msgType: string, variable: any, data: any) {
    const messages: any = {
      REGISTER: `Welcome to GTR Raffle Draws! Your registration OTP is ${variable}. Please enter this code to complete your registration.`,
      LOGIN: `Your GTR Raffle Draws login OTP is ${variable}. Please enter this code to log in to your account.`,
      TICKETS: `Your GTR Ticket Numbers  for contest ${variable?.contestCode} are ${variable?.tickets}. Thank you!!`,
      WIN: `You have winning GTR Ticket Numbers  for contest ${variable?.contestCode} Tickets:( ${variable?.tickets} ). Contact us to claim your prizes now!!`
    };

    data["message_text"] = messages[msgType];

    return axios
      .post(baseUrl, data, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        console.log("SMS sent successfully:", response.data);
        return response.data
      })
      .catch((error) => {
        console.error("Error sending SMS:", error);
        return error?.message
      });
  }
}


