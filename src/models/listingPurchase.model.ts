import mongoose from "mongoose";
import Payout from "./payouts.model";
import VerifiedTransactions from "./verifiedtransactions.model";
import ReferralReward from "./referralrewards.model";
import { checkIfTransactionHasReward } from "../services/v1/listingsServices/reward.service";
import { ADMIN_SETTINGS } from "./settings";
import { constant } from "lodash";
import { convertCurrency } from "../services/v1/conversions/comparison.service";
import { getCountryCodeByCurrencyCode } from "./countries";
import { ItopUps, WalletService } from "../services/v1/wallet/wallet.service";
import { IWallet, Wallet } from "./wallet.model";
import { addWalletBalanceUpdateJob } from "../services/v1/tasks/wallet/transfers.queue";
const Schema = mongoose.Schema;

export interface IPurchaseSalelisting {
  checkOutId?: string;
  account: string;
  cryptoListing: string;
  walletAddress: string;
  paymentOption: string;
  units: number;
  unitPriceAtPurchaseTime?: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const orderStatuses = [
  "Not-Started",
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
  verifiedTransaction: {
    type: Schema.Types.ObjectId,
    ref: "verifiedTransactions",
    required: false,
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
  unitPriceAtPurchaseTime: {
    type: Number,
    required: false,
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
    default: "Not-Started",
  },
  buyerFulfillmentClaim: {
    type: Schema.Types.Mixed,
    enum: ["Pending", "Closed", "Disputed"],
    default: "Pending",
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
      const seller = await mongoose
        .model("accounts")
        .findById(cryptoListing.account);

      // Ensure the cryptoListing and its vendor are found
      if (!cryptoListing || !cryptoListing.account || !seller) {
        throw new Error("Vendor not found for the given cryptoListing.");
      }

      if (!seller) {
        throw new Error("Vendor not found for the given cryptoListing.");
      }

      console.log("cryptoListing.account.geoData", seller.geoData);

      const currencyTo = seller.geoData.currency.code;
      const currencyFrom = verifiedTransaction.data.currency;
      const from = getCountryCodeByCurrencyCode(
        currencyFrom.toUpperCase()
      )!.code;

      const to = getCountryCodeByCurrencyCode(currencyTo.toUpperCase())!.code;
      console.log(from, to, currencyFrom, currencyTo);

      const convertToDefaultCurrency = async (amount: number) => {
        if (from && to && currencyFrom && currencyTo) {
          return await convertCurrency(
            from,
            to,
            currencyFrom,
            currencyTo,
            amount?.toString()
          );
        }
        return null;
      };

      //Revisit
      const computePayout = (units: number, unitPrice: number) => {
        let amount_settled = verifiedTransaction.data?.amount_settled || verifiedTransaction.data?.amount;
        return amount_settled - amount_settled * ADMIN_SETTINGS.escrowFeefactor;
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
      let isConverted = false;
      let payoutAmount = computePayout(doc.units, doc.unitPriceAtPurchaseTime!);
      const payoutAmountUnconverted = JSON.parse(JSON.stringify(payoutAmount));
      const conversionResult = await convertToDefaultCurrency(payoutAmount);
      console.log("conversionResult ==> ", conversionResult);
      if (conversionResult.status) {
        isConverted = true;
        payoutAmount =
          payoutAmount * conversionResult?.data?.data[currencyTo]?.value;
      }

      // Create the payout record within the transaction
      const payout = new Payout({
        checkOutId: doc.checkOutId,
        cryptoListingPurchase: doc._id,
        vendorAccount: cryptoListing.account, // Assuming the vendor is linked to the `cryptoListing`
        payout: payoutAmount,
        paymentMethod: doc.paymentOption,
        isConverted: isConverted,
        payoutDate: getLastDayOfMonth(), // Assuming payment option is used to determine payment method
        conversionMetaData: {
          from,
          to,
          currencyFrom,
          currencyTo,
          payoutAmount: payoutAmountUnconverted,
        },
      });

      // Save the payout within the same transaction
      await payout.save();
      console.log("Payout =====>  ", payout);
      const vendorWallet: IWallet | null = await Wallet.findOne({
        user: payout.vendorAccount,
      });
      console.log("vendorWallet ", vendorWallet);
      if (vendorWallet) {
        const meta: ItopUps = {
          walletAccountNo: vendorWallet.walletAccountNo,
          payoutConversionMetrics: payout.conversionMetaData,
          operationType: "credit",
          payoutId: payout._id,
          verifiedTransactionId: verifiedTransaction._id,
        };
        await addWalletBalanceUpdateJob("payout-topup", payout.payout, meta);
      }

      if (
        ADMIN_SETTINGS.referrals.isActive &&
        buyer.referredBy &&
        buyer?.referredBy?.toString()?.trim() !== ""
      ) {
        const referrer = await mongoose
          .model("accounts")
          .findOne({ referralCode: buyer.referredBy });

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
