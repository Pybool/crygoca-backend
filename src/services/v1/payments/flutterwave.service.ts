// import Flutterwave from "flutterwave-node-v3";
import * as Redis from "ioredis";
const Flutterwave = require("flutterwave-node-v3");
import Xrequest from "../../../interfaces/extensions.interface";
import Accounts from "../../../models/accounts.model";
import VerifiedTransactions from "../../../models/verifiedtransactions.model";
import VerifiedTransactionsNoAuth from "../../../models/verifiedtransactionsNoAccount.model";
import { updatePaymentConfirmation } from "../listingsServices/cryptolisting.service";
import { redisClient } from "../../../redis/init.redis";
import {
  achChargeSuccess,
  mockGooglePayVerificationResponse,
} from "./mock.service";
import CryptoListingPurchase from "../../../models/listingPurchase.model";
export const flutterwaveKeys = {
  PUBLIC: process.env.FLW_PUBLIC_KEY as string,
  SECRET: process.env.FLW_SECRET_KEY as string,
  ENC_KEY: process.env.FLW_ENCRYPTION_KEY as string,
};

const flw = new Flutterwave(flutterwaveKeys.PUBLIC, flutterwaveKeys.SECRET);

interface IverificationData {
  paymentReference: number;
  expectedAmount: number;
  expectedCurrency: string;
  payment_type?:string;
  toRefund?: number;
}

export class FlutterWaveService {
  public static async initiateCardPayment(req: Xrequest) {
    const {
      ref,
      amount,
      email,
      phone,
      currency = "NGN",
      redirect_url,
    } = req.body;

    // Prepare payment data
    const paymentData = {
      tx_ref: ref, //`txn_${new Date().getTime()}`, // Unique transaction reference
      amount,
      currency,
      email,
      phone_number: phone,
      redirect_url,
      enckey: flutterwaveKeys.ENC_KEY,
    };

    try {
      // Call Flutterwave API to initiate payment
      const response = await flw.Charge.card(paymentData);

      if (response.status === "success") {
        return {
          status: true,
          message: "Payment initiation successful",
          data: response.data,
        };
      } else {
        return {
          status: false,
          message: "Payment initiation failed",
          error: response.message,
        };
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
      throw error;
    }
  }

  public static async devGooglepayVerificationResponse(data: any) {
    const googlePayVerificationResponse = mockGooglePayVerificationResponse;
    googlePayVerificationResponse.data.tx_ref = data.tx_ref;
    googlePayVerificationResponse.data.amount = data.amount;
    googlePayVerificationResponse.data.charged_amount = data.amount;
    googlePayVerificationResponse.data.currency = data.currency;
    googlePayVerificationResponse.data.customer.email = data.customer.email;
    googlePayVerificationResponse.data.customer.name = data.customer.name;
    googlePayVerificationResponse.data.created_at = new Date();
    return googlePayVerificationResponse;
  }

  public static async verifyCardPayment(
    data: IverificationData | null = null,
    fullResponse: any = null
  ) {
    const { paymentReference, expectedAmount, expectedCurrency, payment_type } = data!; // The transaction reference from Flutterwave
    console.log("Verification data ", data);
    try {
      // Verify the payment with Flutterwave
      let response = null;
      if (
        payment_type === "googlepay" &&
        process.env.MOCK_VERIFICATION_RESPONSE === "true"
      ) {
        response = await FlutterWaveService.devGooglepayVerificationResponse(
          fullResponse
        );
      } else {
        response = await flw.Transaction.verify({ id: paymentReference });
      }

      console.log("Verification response ", response)

      if (response.status !== "success") {
        const failedVerificationQueue =
          new FailedVerificationQueue<IverificationData>();
        await failedVerificationQueue.enqueue(data!);
      }

      if (
        response.status === "success" &&
        response.data.status === "successful" &&
        response.data.amount >= expectedAmount &&
        response.data.currency === expectedCurrency
      ) {
        if (response.data.amount >= expectedAmount) {
          data!.toRefund = response.data.amount - expectedAmount;
        }
        const account = await Accounts.findOne({
          $or: [
            { email: response.data.customer.email },
            { phone: response.data.customer.phone_number },
          ],
        });
        if (account) {
          const verifiedTransaction = await VerifiedTransactions.create({
            tx_ref: response.data.tx_ref,
            data: response.data,
            account: account._id,
          });
          const cryptoPurchase = await CryptoListingPurchase.findOne({
            checkOutId: verifiedTransaction.tx_ref,
          });
          if (cryptoPurchase) {
            cryptoPurchase.verifiedTransaction = verifiedTransaction._id;
            await cryptoPurchase.save();
          }
          await updatePaymentConfirmation(response.data.tx_ref);
        } else {
          await VerifiedTransactionsNoAuth.create({
            tx_ref: response.data.tx_ref,
            data: response.data,
          });
        }
        return {
          status: true,
          message: "Payment verified successfully",
          data: response.data,
        };
      } else {
        return {
          status: false,
          message: "Payment verification failed",
          error: response.message,
        };
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
    }
  }

  public static async initiateACHPayment(req: Xrequest) {
    const { ref, amount, email, currency = "usd" } = req.body;
    const payload = {
      amount: amount,
      currency: currency,
      email: email,
      tx_ref: ref,
    };

    if (payload.currency !== "USD" && payload.currency !== "usd") {
      return {
        status: false,
        message: "ACH payment is only available for USD payments",
      };
    }

    /* Development environment only */
    if (process.env.NODE_ENV === "dev") {
      achChargeSuccess.data.amount = payload.amount;
      achChargeSuccess.data.charged_amount = payload.amount;
      achChargeSuccess.data.customer.email = payload.email;
      achChargeSuccess.data.tx_ref = payload.tx_ref;

      return {
        status: true,
        message: "Payment initiation successful",
        data: achChargeSuccess,
      };
    }

    try {
      // Call Flutterwave API to initiate payment
      const response = await flw.Charge.ach(payload);

      if (response.status === "success") {
        return {
          status: true,
          message: "Payment initiation successful",
          data: response.data,
        };
      } else {
        return {
          status: false,
          message: "Payment initiation failed",
          error: response.message,
        };
      }
    } catch (error) {
      console.error("Error initiating payment:", error);
      throw error;
    }
  }
}

export class FailedVerificationQueue<T> {
  private redis: Redis.Redis;

  constructor() {
    this.redis = redisClient.generic;
  }

  async enqueue(item: T): Promise<void> {
    await this.redis.lpush("failed_verifications", JSON.stringify(item)); // Add to the left side (front)
  }

  async dequeue(): Promise<string | null> {
    return this.redis.rpop("failed_verifications"); // Remove from the right side (end)
  }

  async size(): Promise<number> {
    return this.redis.llen("failed_verifications"); // Get the size of the queue
  }

  // Peek at the first item in the queue without removing it
  async peek(): Promise<string | null> {
    return this.redis.lindex("failed_verifications", 0); // Get the item at index 0 (front of the queue)
  }

  // Remove and return the first item (front) from the queue
  async removeFirst(): Promise<string | null> {
    return this.redis.lpop("failed_verifications"); // Remove from the left side (front)
  }

  async clear(): Promise<void> {
    await this.redis.del("failed_verifications"); // Clear the queue
  }
}
