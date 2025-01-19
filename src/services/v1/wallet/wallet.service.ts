import mongoose from "mongoose";
import {
  IuserDetails,
  IWalletTransaction,
  WalletTransaction,
} from "../../../models/wallet-transaction.model";
import { IWallet, Wallet } from "../../../models/wallet.model";
import Accounts from "../../../models/accounts.model";
import { NotificationModel } from "../../../models/notifications.model";
import mailActions from "../mail/mailservice";
import {
  generateOtp,
  getExpirableCode,
  setExpirableCode,
} from "../auth/helper";
import {
  IWalletBeneficiary,
  WalletBeneficiary,
} from "../../../models/wallet-beneficiaries.model";
import Xrequest from "../../../interfaces/extensions.interface";
import { WalletNotificationService } from "./wallet-notifications.service";
import { withdrawToLocalBankHandler } from "./transfers.handlers";
import { generateReferenceCode } from "../helpers";
import Withdrawals from "../../../models/withdrawals.model";
import { WithdrawalStatusQueue } from "./withdrawals-status.queue";
import { addWalletBalanceUpdateJob } from "../tasks/wallet/transfers.queue";

//For Payout topup and direct topups
export interface ItopUps {
  walletAccountNo: string;
  operationType: string;
  payoutId?: mongoose.Types.ObjectId;
  payoutConversionMetrics?: any;
  verifiedTransactionId?: mongoose.Types.ObjectId;
}

export class WalletService {
  private static generateRandomAccountNumber() {
    const prefix = "CW-";
    const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000); // Generate 10 random digits
    return `${prefix}${randomDigits}`;
  }

  public static async generateUniqueAccountNumber() {
    let unique = false;
    let accountNumber;

    while (!unique) {
      accountNumber = WalletService.generateRandomAccountNumber();
      const existingAccount = await Wallet.findOne({ accountNumber });
      if (!existingAccount) {
        unique = true; // Exit the loop if the account number is unique
      }
    }

    return accountNumber;
  }

  public static async createWallet(userId: mongoose.Types.ObjectId) {
    const account = await Accounts.findOne({ _id: userId });
    if (!account) {
      return null;
    }

    if(account.walletCreated){
      return null;
    }

    if (!account?.geoData?.currency?.code) {
      return null;
    }

    const walletAccountNo: string | undefined =
      await WalletService.generateUniqueAccountNumber()!;
    if (!walletAccountNo) {
      return null;
    }
    const wallet:IWallet =  await Wallet.create({
      user: account._id,
      walletAccountNo,
      currency: account.geoData.currency.code,
      currencySymbol: account.geoData.currency.symbol,
    });
    if(wallet){
      account.walletCreated = true;
      await account.save()
    }
    return wallet;
  }

  public static async getWallet(userId: mongoose.Types.ObjectId) {
    try {
      const wallet: IWallet | null = await Wallet.findOne({ user: userId });
      if (!wallet) {
        return {
          status: false,
          message: "No wallet for found for user",
        };
      }
      return {
        status: true,
        data: wallet,
        message: "Wallet for user was successfully retrieved",
      };
    } catch (error: any) {
      throw error;
    }
  }

  public static async getReceipientWallet(walletId: string) {
    try {
      const wallet: IWallet | null = await Wallet.findOne({
        walletAccountNo: walletId,
      }).populate("user");
      return wallet;
    } catch (error: any) {
      throw error;
    }
  }

  public static async updateWalletBalance(
    type: string,
    amount: number,
    meta: ItopUps | null, //For Payout topup and direct topups
    debitDetails?: {
      walletAccountNo: string;
      currency: string;
      amount: number;
    },
    creditDetails?: {
      walletAccountNo: string;
      currency: string;
      amount: number;
    },
    saveBeneficiary?: boolean
  ) {
    if (type === "wallet-transfer") {
      return await WalletService.walletTransfer(
        type,
        amount,
        debitDetails!,
        creditDetails!,
        saveBeneficiary
      );
    } else if (type === "payout-topup") {
      return await WalletService.walletPayoutTopUp(type, amount, meta!);
    } else if (type === "direct-topup") {
      return await WalletService.walletDirectTopUp(type, amount, meta!);
    } else if (type === "wallet-withdrawal") {
      return await WalletService.walletWithdrawal(type, amount, meta!);
    }
  }

  public static async validateTransfer(
    senderWalletAccountNo: string,
    receiverWalletAccountNo: string,
    currency: string,
    amount: number
  ) {
    // Debit operation: Decrease balance for sender
    const senderWallet: IWallet | null = await Wallet.findOne({
      walletAccountNo: senderWalletAccountNo,
    });

    const receiverWallet: IWallet | null = await Wallet.findOne({
      walletAccountNo: receiverWalletAccountNo,
    });

    console.log(senderWalletAccountNo, currency, amount, senderWallet);

    if (!senderWallet) {
      throw new Error("Sender has no wallet");
    }

    if (!receiverWallet) {
      throw new Error("Receipient has no wallet");
    }

    if (currency !== senderWallet.currency) {
      throw new Error("Invalid currency for sender's wallet");
    }

    if (senderWallet.balance < amount) {
      throw new Error("Insufficient balance in sender's wallet");
    }

    return senderWallet;
  }

  private static async walletTransfer(
    type: string,
    amount: number,
    debitDetails: { walletAccountNo: string; currency: string; amount: number },
    creditDetails: {
      walletAccountNo: string;
      currency: string;
      amount: number;
    },
    saveBeneficiary?: boolean
  ) {
    let rollbackActions = []; // To store rollback operations
    let senderWalletTransaction: IWalletTransaction | null = null;
    let receiverWalletTransaction: IWalletTransaction | null = null;
    let senderNotification: any = null;
    let receiverNotification: any = null;

    try {
      const senderWalletAccountNo: string = debitDetails.walletAccountNo;
      const receiverWalletAccountNo: string = creditDetails.walletAccountNo;
      const senderWalletCurrency: string = debitDetails.currency;
      const reference = generateReferenceCode("CWT-");

      const validatedSenderWallet = await WalletService.validateTransfer(
        senderWalletAccountNo,
        receiverWalletAccountNo,
        senderWalletCurrency,
        debitDetails.amount
      );

      if (!validatedSenderWallet) {
        throw new Error("Tranfer details could not be verified");
      }

      // Debit operation: Decrease balance for sender
      const senderWallet = await Wallet.findOneAndUpdate(
        { walletAccountNo: senderWalletAccountNo },
        { $inc: { balance: -1 * debitDetails.amount } },
        { new: true } // Return the updated document
      );

      if (!senderWallet) {
        throw new Error("Sender has no wallet");
      }

      if (senderWallet.balance < debitDetails.amount) {
        throw new Error("Insufficient balance in sender's wallet");
      } else {
        senderWalletTransaction = await WalletTransaction.create({
          user: senderWallet.user,
          creditWalletAccountNo: receiverWalletAccountNo,
          debitWalletAccountNo: senderWalletAccountNo,
          amount: debitDetails.amount,
          type: type,
          operationType: "debit",
          reference: reference
        });

        await senderWalletTransaction.populate(
          "user",
          "_id firstname lastname username email geoData"
        );

        senderNotification =
          await WalletNotificationService.createDebitNotification(
            senderWalletTransaction
          );
      }

      // Add rollback for debit (re-add the amount if something goes wrong later)
      rollbackActions.push(() =>
        Wallet.updateOne(
          { walletAccountNo: senderWalletAccountNo },
          { $inc: { balance: debitDetails.amount } }
        )
      );

      rollbackActions.push(() =>
        WalletTransaction.deleteOne({
          _id: senderWalletTransaction!._id,
        })
      );

      rollbackActions.push(() =>
        NotificationModel.deleteOne({
          _id: senderNotification!._id,
        })
      );

      rollbackActions.push(() =>
        WalletNotificationService.createCreditNotification(
          senderWalletTransaction!,
          true
        )
      );

      // Credit operation: Increase balance for receiver
      const receiverWallet = await Wallet.findOneAndUpdate(
        { walletAccountNo: receiverWalletAccountNo },
        { $inc: { balance: creditDetails.amount } },
        { new: true }
      );

      if (!receiverWallet) {
        throw new Error("Receiver wallet not found");
      } else {
        receiverWalletTransaction = await WalletTransaction.create({
          user: receiverWallet.user,
          creditWalletAccountNo: receiverWalletAccountNo,
          debitWalletAccountNo: senderWalletAccountNo,
          amount: creditDetails.amount,
          type: type,
          operationType: "credit",
          reference: reference
        });

        receiverWalletTransaction = await receiverWalletTransaction.populate(
          "user",
          "_id firstname lastname username email geoData"
        );

        receiverNotification =
          await WalletNotificationService.createCreditNotification(
            receiverWalletTransaction
          );
      }

      // Add rollback for credit (subtract the amount if something goes wrong later)
      rollbackActions.push(() =>
        Wallet.updateOne(
          { walletAccountNo: receiverWalletAccountNo },
          { $inc: { balance: -1 * creditDetails.amount } }
        )
      );

      rollbackActions.push(() =>
        WalletTransaction.deleteOne({
          _id: receiverWalletTransaction!._id,
        })
      );

      rollbackActions.push(() =>
        NotificationModel.deleteOne({
          _id: receiverNotification!._id,
        })
      );

      rollbackActions.push(() =>
        WalletNotificationService.createDebitNotification(
          receiverWalletTransaction!,
          true
        )
      );

      if (saveBeneficiary) {
        const beneficiaryData: IWalletBeneficiary = {
          account: senderWallet.user,
          beneficiaryAccount: receiverWallet.user,
          receiverWallet: receiverWallet,
        };

        const beneficiary: any = await WalletBeneficiary.findOne({
          account: senderWallet.user,
          beneficiaryAccount: receiverWallet.user,
        });

        if (!beneficiary) {
          await WalletBeneficiary.create(beneficiaryData);
        }
      }

      console.log("Wallet operations completed successfully.");
    } catch (error: any) {
      console.error("Error occurred:", error.message);

      // Perform rollback actions
      for (const rollback of rollbackActions) {
        try {
          await rollback(); // Execute each rollback operation
        } catch (rollbackError: any) {
          console.error("Rollback failed:", rollbackError.message);
        }
      }

      console.error("All operations were rolled back.");
    }
  }

  private static async walletPayoutTopUp(
    type: string,
    amount: number,
    meta: ItopUps
  ) {
    let rollbackActions = []; // To store rollback operations
    let walletTransaction: IWalletTransaction | null = null;
    let walletNotification: any = null;
    const reference = generateReferenceCode("CWP-");

    try {
      const positiveAmount = Math.abs(amount);
      let operation = { $inc: { balance: -1 * positiveAmount } }; // Debit Operation
      if (meta.operationType === "credit") {
        operation = { $inc: { balance: positiveAmount } }; // Credit Operation
      }
      const wallet = await Wallet.findOneAndUpdate(
        { walletAccountNo: meta.walletAccountNo },
        operation,
        { new: true } // Return the updated document
      );

      if (!wallet) {
        throw new Error("No wallet was fund for account number.");
      }

      if (wallet) {
        walletTransaction = await WalletTransaction.create({
          user: wallet.user,
          payout: meta.payoutId,
          amount: positiveAmount,
          type: type,
          operationType: meta.operationType,
          reference:reference
        })!;
      }

      if(walletTransaction?.payout){
        walletTransaction = await walletTransaction.populate({
          path: "payout",
          model: "Payout", // Ensure the model name matches
          populate: {
            path: "cryptoListingPurchase",
            model: "cryptolistingpurchase",
            populate: {
              path: "cryptoListing",
              model: "cryptolisting",
              populate: {
                path: "cryptoCurrency",
                model: "cryptocurrencies",
              },
            },
          },
        })
      }

      walletTransaction = await walletTransaction!.populate(
        "user",
        "_id firstname lastname username email geoData"
      )!;

      // Add rollback for debit (re-add the amount if something goes wrong later)
      let inverseOperation = { $inc: { balance: positiveAmount } };
      if (meta.operationType === "credit") {
        inverseOperation = { $inc: { balance: -1 * positiveAmount } }; // Debit Operation
        walletNotification =
          await WalletNotificationService.createCreditNotification(
            walletTransaction!
          );
      }

      rollbackActions.push(async () => {
        await Wallet.findOneAndUpdate(
          { walletAccountNo: meta.walletAccountNo },
          inverseOperation,
          { new: true }
        );
      });

      rollbackActions.push(() =>
        WalletTransaction.deleteOne({
          _id: walletTransaction!._id,
        })
      );

      rollbackActions.push(async () => {
        NotificationModel.deleteOne({
          _id: walletNotification!._id,
        });

        walletNotification =
          await WalletNotificationService.createDebitNotification(
            walletTransaction!
          );
      });
      // throw new Error("Error for testing rollback");

      console.log("Wallet operations completed successfully.");
    } catch (error: any) {
      console.error("Error occurred:", error.message);

      // Perform rollback actions
      for (const rollback of rollbackActions) {
        try {
          await rollback(); // Execute each rollback operation
        } catch (rollbackError: any) {
          console.error("Rollback failed:", rollbackError.message);
        }
      }
      console.error("All operations were rolled back.");
    }
  }

  private static async walletDirectTopUp(
    type: string,
    amount: number,
    meta: ItopUps
  ) {}

  public static async walletGetBeneficiaries(req: Xrequest) {
    try {
      let wallet: IWallet | null | undefined = null;
      const page = parseInt(req.query.page as string, 10) || 1;
      const limit = parseInt(req.query.limit as string, 10) || 10;
      const skip = (page - 1) * limit;
      const accountId: string = req.accountId as string;
      const query = { account: accountId };
      const walletResponse = await WalletService.getWallet(
        new mongoose.Types.ObjectId(accountId)
      );
      if (walletResponse.status) {
        wallet = walletResponse.data;
      }
      const beneficiaries = await WalletBeneficiary.find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate({
          path: "receiverWallet",
          model: "Wallet", // Ensure the model name matches
          populate: {
            path: "user",
            model: "accounts",
          },
        })
        .exec();

      // Count total documents for pagination metadata
      const totalDocuments = await WalletBeneficiary.countDocuments(query);
      // Build the response with pagination metadata
      const response: any = {
        beneficiaries,
        wallet,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalDocuments / limit),
          totalDocuments,
        },
      };

      return response;
    } catch (error: any) {
      throw error;
    }
  }

  public static async walletWithdrawal(
    type: string,
    amount: number,
    meta: ItopUps
  ) {
    let rollbackActions = []; // To store rollback operations
    let walletTransaction: IWalletTransaction | null = null;
    let walletNotification: any = null;
    const reference = generateReferenceCode("CWW-");

    try {
      const positiveAmount = Math.abs(amount);
      let operation = { $inc: { balance: positiveAmount } }; // Credit Operation
      if (meta.operationType === "debit") {
        operation = { $inc: { balance: -1 * positiveAmount } }; // Debit Operation
      }
      const wallet = await Wallet.findOneAndUpdate(
        { walletAccountNo: meta.walletAccountNo },
        operation,
        { new: true } // Return the updated document
      );

      if (!wallet) {
        throw new Error("No wallet was fund for account number.");
      }

      if (meta.operationType === "debit") {
        if (wallet.balance < positiveAmount) {
          throw new Error("Insufficient balance in wallet");
        }
      }

      if (wallet) {
        walletTransaction = await WalletTransaction.create({
          user: wallet.user,
          amount: positiveAmount,
          type: type,
          operationType: meta.operationType,
          reference: reference
        })!;
      }

      walletTransaction = await walletTransaction!.populate(
        "user",
        "_id firstname lastname username email geoData"
      )!;

      // Add rollback for debit (re-add the amount if something goes wrong later)
      let inverseOperation = { $inc: { balance: -1 * positiveAmount } };
      if (meta.operationType === "debit") {
        inverseOperation = { $inc: { balance: positiveAmount } }; // Credit Operation
        walletNotification =
          await WalletNotificationService.createDebitNotification(
            walletTransaction!
          );
      }

      rollbackActions.push(async () => {
        await Wallet.findOneAndUpdate(
          { walletAccountNo: meta.walletAccountNo },
          inverseOperation,
          { new: true }
        );
      });

      rollbackActions.push(() =>
        WalletTransaction.deleteOne({
          _id: walletTransaction!._id,
        })
      );

      rollbackActions.push(async () => {
        NotificationModel.deleteOne({
          _id: walletNotification!._id,
        });
        walletNotification =
          await WalletNotificationService.createCreditNotification(
            walletTransaction!
          );
      });
      // throw new Error("Error for testing rollback");

      console.log("Wallet operations completed successfully.");
    } catch (error: any) {
      console.error("Error occurred:", error.message);

      // Perform rollback actions
      for (const rollback of rollbackActions) {
        try {
          await rollback(); // Execute each rollback operation
        } catch (rollbackError: any) {
          console.error("Rollback failed:", rollbackError.message);
        }
      }
      console.error("All operations were rolled back.");
    }
  }

  public static async processToLocalBankWithdrawal(
    type: "wallet-to-bank-withdrawal",
    data: any,
    hash: string,
    accountId: string
  ) {
    try {
      if (type !== "wallet-to-bank-withdrawal") {
        throw new Error("Invalid request and operation type");
      }
      const senderWallet: IWallet | null = await Wallet.findOne({
        user: accountId,
      });

      if (!senderWallet) {
        throw new Error("Sender has no wallet");
      }
      if (senderWallet.balance < data.amount) {
        throw new Error("Insufficient balance in wallet");
      }
      data.reference = generateReferenceCode("BW-");
      console.log("Complete Withdrawal data =-==> ", data);
      const withdrawalResponse = await withdrawToLocalBankHandler(data);
      console.log("WithdrawalResponse ==> ", withdrawalResponse);
      const withdrawal = await Withdrawals.create({
        wallet: senderWallet._id,
        account: new mongoose.Types.ObjectId(accountId),
        status: withdrawalResponse.data.status,
        hash: hash,
        reference: data.reference,
        payload: data,
        queuedResponse: withdrawalResponse,
      });
      if (withdrawal.status === "NEW") {
        const withdrawalStatusQueue = new WithdrawalStatusQueue<any>();
        await withdrawalStatusQueue.enqueue(withdrawal!);
        //Debit customer's wallet
        await addWalletBalanceUpdateJob(
          "wallet-withdrawal",
          withdrawalResponse.data.amount,
          {
            operationType: "debit",
            walletAccountNo: senderWallet.walletAccountNo,
          }
        );
      }
    } catch (error: any) {
      console.log("Withdrawal error ", error?.message);
    }
  }

  public static async updateWithdrawalStatus(data: {
    initialPayload: any;
    transferRespponse: any;
  }) {
    try {
      const withdrawal = await Withdrawals.findOne({
        _id: data.initialPayload._id,
      });
      if (withdrawal) {
        withdrawal.status = "SUCCESS";
        withdrawal.verificationResponse = data.transferRespponse;
        await withdrawal.save();
      }
    } catch (error) {}
  }
}

// button.Button.Button_sm.APIRequest-example-button1DGMsfaOTVNW {
//   background: whitesmoke;
//   color: black;
//   flex-direction: column;
//   width: max-content;
// }
