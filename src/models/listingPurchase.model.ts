import mongoose from "mongoose";
import Payout from "./payouts.model";
import VerifiedTransactions from "./verifiedtransactions.model";
import ReferralReward from "./referralrewards.model";
import { checkIfTransactionHasReward } from "../services/v1/listingsServices/reward.service";
import { ADMIN_SETTINGS } from "./settings";
const Schema = mongoose.Schema;

export interface IPurchaseSalelisting {
  checkOutId?: string;
  account: string;
  cryptoListing: string;
  walletAddress: string;
  paymentOption: string;
  units: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const orderStatuses = [
  "Pending",
  "In-Progress",
  "Completed",
  "Closed",
  "Disputed",
];

const CryptoListingPurchaseSchema = new Schema({
  checkOutId: {
    type: String,
    required: false,
  },
  account: {
    type: Schema.Types.ObjectId,
    ref: "accounts",
    required: true,
  },
  cryptoListing: {
    type: Schema.Types.ObjectId,
    ref: "cryptolisting",
    required: true,
  },
  walletAddress: {
    type: String,
    required: false,
  },
  paymentOption: {
    type: String,
    required: false,
  },
  units: {
    type: Number,
    required: true,
    default: 0,
  },
  notes: {
    type: String,
    required: false,
  },
  escrowFeefactor: {
    type: Number,
    default: 0.02,
  },
  paymentConfirmed: {
    type: Boolean,
    required: false,
    default: false,
  },
  fulfillmentStatus: {
    type: String,
    enum: orderStatuses,
    default: "Pending",
  },
  buyerFulfillmentClaim: {
    type: Schema.Types.Mixed,
    enum: ["Closed", "Disputed"],
    default: null,
  },
  createdAt: {
    type: Date,
    required: true,
  },
  updatedAt: {
    type: Date,
    required: true,
  },
});

CryptoListingPurchaseSchema.post("save", async function (doc) {
  // Check if buyerFulfillmentClaim has been set to "Completed" and wasn't previously completed
  if (
    doc.fulfillmentStatus === "Completed" &&
    doc.buyerFulfillmentClaim === "Closed"
  ) {
    try {
      // Get the vendor details from the cryptoListing
      const verifiedTransaction = await VerifiedTransactions.findOne({
        tx_ref: doc.checkOutId?.toString(),
      });

      const existingPayout = await Payout.findOne({
        checkOutId: doc.checkOutId?.toString(),
      });
      if (existingPayout) {
        throw new Error("Checkout id already has an existing payout");
      }
      if (!verifiedTransaction) {
        throw new Error(
          "No verified transaction/payments was found for this purchase"
        );
      }
      const cryptoListing = await mongoose
        .model("cryptolisting")
        .findById(doc.cryptoListing);

      const buyer = await mongoose.model("accounts").findById(doc.account);

      // Ensure the cryptoListing and its vendor are found
      if (!cryptoListing || !cryptoListing.account) {
        throw new Error("Vendor not found for the given cryptoListing.");
      }

      //Revisit
      const computePayout = (units: number, unitPrice: number) => {
        let amount_settled = verifiedTransaction.data.amount_settled;
        return (amount_settled - (amount_settled * ADMIN_SETTINGS.escrowFeefactor))
      };

      const getLastDayOfMonth = () => {
        const today = new Date();
        // Set the date to the 1st day of the next month
        const nextMonth: any = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          1
        );
        // Subtract one day to get the last day of the current month
        const lastDay = new Date(nextMonth - 1);
        return lastDay;
      };

      // Calculate the payout amount
      const payoutAmount = computePayout(doc.units, cryptoListing.unitPrice); // Example logic for payout amount
      // Create the payout record within the transaction
      const payout = new Payout({
        checkOutId: doc.checkOutId,
        cryptoListingPurchase: doc._id,
        vendorAccount: cryptoListing.account, // Assuming the vendor is linked to the `cryptoListing`
        payout: payoutAmount,
        paymentMethod: doc.paymentOption,
        payoutDate: getLastDayOfMonth(), // Assuming payment option is used to determine payment method
      });

      // Save the payout within the same transaction
      await payout.save();

      console.log("Buyer ", buyer);

      if (
        ADMIN_SETTINGS.referrals.isActive &&
        buyer.referredBy &&
        buyer?.referredBy?.toString()?.trim() !== ""
      ) {
        const referrer = await mongoose
          .model("accounts")
          .findOne({ referralCode: buyer.referredBy });
        console.log("referrer ", referrer);
        if (referrer) {
          const transactionIsRewardable: any =
            await checkIfTransactionHasReward(verifiedTransaction);
          if (transactionIsRewardable.eligibleForReward) {
            console.log("REF DATA ===> ", {
              referralCode: buyer.referredBy,
              rewardAmount: transactionIsRewardable.rewardAmount,
              verifiedTransaction: verifiedTransaction._id,
            });
            await ReferralReward.create({
              referralCode: buyer.referredBy,
              rewardAmount: transactionIsRewardable.rewardAmount,
              verifiedTransaction: verifiedTransaction._id,
            });
          }
        }
      }

      // Commit the transaction
      console.log(`Payout created for listing purchase ${doc._id}`);
    } catch (error) {
      console.log("Error ", error);
      // If anything goes wrong, abort the transaction and rollback the changes
      console.error("Error creating payout:", error);
    } finally {
      // End the session
    }
  }
});

const CryptoListingPurchase = mongoose.model(
  "cryptolistingpurchase",
  CryptoListingPurchaseSchema
);
export default CryptoListingPurchase;
