import axios from "axios";
import Xrequest from "../../../interfaces/extensions.interface";

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
      console.log("Payment Response:", response.data);
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
