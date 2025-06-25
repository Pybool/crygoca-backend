import axios from "axios";
import Xrequest from "../../../interfaces/extensions.interface";
import { googlePayChargeSuccess } from "./mock.service";
import { generateReferenceCode } from "../helpers";


export class GooglePayService {
  public static async makeGooglePayCharge(req: Xrequest) {
    const url = "https://api.flutterwave.com/v3/charges?type=googlepay";
    const secretKey = process.env.FLW_SECRET_KEY! as string; // Replace with your actual secret key

    const payload = req.body;

    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      });
      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios Error:", error.response?.data || error.message);
        /* Development simulation... */
        if(process.env.MOCK_VERIFICATION_RESPONSE=='true'){
          const googlePayChargeSuccessResponse = googlePayChargeSuccess;
          googlePayChargeSuccessResponse.data.tx_ref = payload.tx_ref;
          googlePayChargeSuccessResponse.data.amount = payload.amount;
          googlePayChargeSuccessResponse.data.charged_amount = payload.amount;
          googlePayChargeSuccessResponse.data.currency = payload.currency;
          googlePayChargeSuccessResponse.data.customer.email = payload.email;
          googlePayChargeSuccessResponse.data.customer.name = payload.fullname;
          googlePayChargeSuccessResponse.data.created_at = new Date();
          return {
            status: true,
            data: googlePayChargeSuccess
          }
        }
        
        return {
          status: false,
          message: "Failed to create charge",
        };
      } else {
        console.error("Unexpected Error:", error);
        return {
          status: false,
          message: "Failed to create charge",
        };
      }
    }
  }

  public static async googlePayTokenizedCharge(req: Xrequest) {
    const url = "https://api.flutterwave.com/v3/charges?type=googlepay";
    const secretKey = process.env.FLW_SECRET_KEY! as string; // Replace with your actual secret key
    const payload = req.body;
    payload.tx_ref = generateReferenceCode()
    
    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
      });
      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Axios Error:", error.response?.data || error.message);
        return {
          status: false,
          message: "Failed to create charge",
        };
      } else {
        console.error("Unexpected Error:", error);
        return {
          status: false,
          message: "Failed to create charge",
        };
      }
    }
  }
}
