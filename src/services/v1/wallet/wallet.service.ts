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
import { disconnectDatabase, generateReferenceCode } from "../helpers";
import Withdrawals from "../../../models/withdrawals.model";
import { WithdrawalStatusQueue } from "./withdrawals-status.queue";
import { addWalletBalanceUpdateJob } from "../tasks/wallet/transfers.queue";
import { WalletFailedtasksHandler } from "./wallet-failurehandler.service";
import { randomUUID } from "crypto";
import Payout from "../../../models/payouts.model";
import { WalletAuthorization } from "./wallet-authorizations.service";
import logger from "../../../bootstrap/logger";
import { getTestConfig } from "../../../../config";
import { processRollbacks, registerRollback } from "./rollback.service";

//For Payout topup and direct topups
export interface ItopUps {
  walletAccountNo: string;
  operationType: string;
  payoutId?: mongoose.Types.ObjectId;
  payoutConversionMetrics?: any;
  verifiedTransactionId?: mongoose.Types.ObjectId;
  uuid?: string;
}

export class WalletService {
  private static generateRandomAccountNumber(account: any): string {
    const areaCode: string = account.geoData.isoCode; // ISO Code (e.g., "180")
    const shortTimestamp: number = Math.floor(Date.now() / 1000); // Current timestamp in seconds
    const walletAccountNo: string = `${areaCode}${shortTimestamp}`;
    return walletAccountNo;
  }

  public static async generateUniqueAccountNumber(account: any) {
    let unique = false;
    let accountNumber;

    while (!unique) {
      accountNumber = WalletService.generateRandomAccountNumber(account);
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
      return {
        status: false,
        message: "No account found for user",
      };
    }

    if (account.walletCreated) {
      return {
        status: false,
        message: "You already have an existing wallet.",
      };
    }

    if (!account?.geoData?.currency?.code) {
      return {
        status: false,
        message:
          "Failed to create your wallet, please ensure you have updated preferred currency in profile section or try again later!",
      };
    }

    const walletAccountNo: string | undefined =
      await WalletService.generateUniqueAccountNumber(account)!;
    if (!walletAccountNo) {
      return {
        status: false,
        message: "Failed to generate an account number for wallet",
      };
    }
    const wallet: IWallet = await Wallet.create({
      user: account._id,
      walletAccountNo,
      currency: account.geoData.currency.code,
      currencySymbol: account.geoData.currency.symbol,
    });

    if (wallet) {
      account.walletCreated = true;
      await account.save();
    }
    return {
      status: true,
      message: "Wallet created successfully.",
      wallet: wallet,
    };
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

  public static async getReceipientWallet(
    walletId: string,
    accountId: string | null = null
  ) {
    try {
      let myWallet: IWallet | null = null;
      if (accountId) {
        myWallet = await Wallet.findOne({
          user: accountId,
        });
      }

      if (myWallet && myWallet?.walletAccountNo == walletId) {
        return {
          status: false,
          message:
            "You cannot make a transfer to your own wallet, you can only transfer to other crygoca wallets",
        };
      }

      const wallet: IWallet | null = await Wallet.findOne({
        walletAccountNo: walletId,
      }).populate("user");

      if (!wallet) {
        return {
          status: false,
          message: "Failed to retrieve receipient wallet!",
        };
      }
      return {
        status: true,
        message: "Recipient wallet retrieved successfully!",
        wallet: wallet,
      };
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
      otp?: string;
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
    amount: number,
    otp: string
  ) {
    // Debit operation: Decrease balance for sender
    const senderWallet: IWallet | null = await Wallet.findOne({
      walletAccountNo: senderWalletAccountNo,
    });

    const receiverWallet: IWallet | null = await Wallet.findOne({
      walletAccountNo: receiverWalletAccountNo,
    });

    const transferIntentWithCode: {
      walletToDebit: string;
      walletToCredit: string;
      otp: string;
    } = {
      walletToDebit: senderWalletAccountNo,
      walletToCredit: receiverWalletAccountNo,
      otp: otp,
    };

    const response = await WalletAuthorization.verifyTransferOtp(
      transferIntentWithCode
    );

    console.log("Transfer verification response=====> ", response);

    if (!response.status) {
      throw new Error("Unauthorized transfer attempt");
    }

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
    debitDetails: {
      walletAccountNo: string;
      currency: string;
      amount: number;
      otp?: string;
    },
    creditDetails: {
      walletAccountNo: string;
      currency: string;
      amount: number;
    },
    saveBeneficiary?: boolean
  ) {
    let rollbackActions: any = []; // To store rollback operations
    let senderWalletTransaction: IWalletTransaction | null = null;
    let receiverWalletTransaction: IWalletTransaction | null = null;
    let senderNotification: any = null;
    let receiverNotification: any = null;
    const senderWalletAccountNo: string = debitDetails.walletAccountNo;
    const receiverWalletAccountNo: string = creditDetails.walletAccountNo;

    try {
      const senderWalletCurrency: string = debitDetails.currency;
      const reference = generateReferenceCode("CWT-");

      const validatedSenderWallet = await WalletService.validateTransfer(
        senderWalletAccountNo,
        receiverWalletAccountNo,
        senderWalletCurrency,
        debitDetails.amount,
        debitDetails.otp!
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
      if (senderWallet) {
        senderWallet.updatedAt = new Date();
        await senderWallet.save();
      }

      // Add rollback for debit (re-add the amount if something goes wrong later)

      let rollBackId: string = randomUUID();
      registerRollback(
        rollBackId,
        "UPDATE-ONE",
        "Wallet",
        { walletAccountNo: senderWalletAccountNo },
        { $inc: { balance: debitDetails.amount } }
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
          reference: reference,
        });

        // rollBackId = randomUUID();
        // registerRollback(
        //   rollBackId,
        //   "DELETE",
        //   "WalletTransaction",
        //   { _id: senderWalletTransaction!._id}
        // );

        await senderWalletTransaction.populate(
          "user",
          "_id firstname lastname username email geoData"
        );

        senderNotification =
          await WalletNotificationService.createDebitNotification(
            senderWallet,
            senderWalletTransaction
          );
        //Redis Roll back...
        rollBackId = randomUUID();
        senderWalletTransaction!.operationType = "credit";
        registerRollback(rollBackId, "NOTIFICATION", "Notification", {
          wallet: senderWallet,
          walletTransaction: senderWalletTransaction,
          isRollBack: true,
        });
      }

      //Testing
      // logger.info("TEST_ERROR " + getTestConfig().TEST_ERROR);
      // console.log("TEST_ERROR " + getTestConfig().TEST_ERROR);
      // if (getTestConfig().TEST_ERROR === "true") {
      //   throw new Error("Error to test rollback mechanism");
      // }
      // if (getTestConfig().DISCONNECT_DATABASE === "true") {
      //   await disconnectDatabase();
      // }

      // Credit operation: Increase balance for receiver
      const receiverWallet = await Wallet.findOneAndUpdate(
        { walletAccountNo: receiverWalletAccountNo },
        { $inc: { balance: creditDetails.amount } },
        { new: true }
      );

      // Add rollback for credit (subtract the amount if something goes wrong later)
      rollBackId = randomUUID();
      registerRollback(
        rollBackId,
        "UPDATE-ONE",
        "Wallet",
        { walletAccountNo: receiverWalletAccountNo },
        { $inc: { balance: -1 * creditDetails.amount } }
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
          reference: reference,
        });

        // rollBackId = randomUUID();
        // registerRollback(
        //   rollBackId,
        //   "DELETE",
        //   "WalletTransaction",
        //   { _id: receiverWalletTransaction!._id}
        // );

        receiverWalletTransaction = await receiverWalletTransaction.populate(
          "user",
          "_id firstname lastname username email geoData"
        );

        receiverNotification =
          await WalletNotificationService.createCreditNotification(
            receiverWallet,
            receiverWalletTransaction
          );
        //Redis Roll back...
        rollBackId = randomUUID();
        registerRollback(rollBackId, "NOTIFICATION", "Notification", {
          wallet: receiverWallet,
          walletTransaction: receiverWalletTransaction,
          isRollBack: true,
        });
      }

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
      // Perform rollback actions and save fail job in database or redis
      await processRollbacks();
      await WalletFailedtasksHandler.registerfailedJob(type, amount, {
        operationType: "wallet-transfer",
        senderWalletAccountNo: senderWalletAccountNo,
        receiverWalletAccountNo: receiverWalletAccountNo,
        verifiedTransactionId: randomUUID(),
      });
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
      const payout = await Payout.findOne({ _id: meta.payoutId });
      if (!payout) {
        throw new Error("No payout exists for meta.payoutId");
      }

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
      let rollBackId: string = randomUUID();

      if (wallet) {
        // Add rollback for debit (re-add the amount if something goes wrong later)
        let inverseOperation = { $inc: { balance: positiveAmount } };
        if (meta.operationType === "credit") {
          inverseOperation = { $inc: { balance: -1 * positiveAmount } }; // Debit Operation
        }

        rollbackActions.push(async () => {
          await Wallet.findOneAndUpdate(
            { walletAccountNo: meta.walletAccountNo },
            inverseOperation,
            { new: true }
          );
        });

        registerRollback(
          rollBackId,
          "UPDATE-ONE",
          "Wallet",
          { walletAccountNo: meta.walletAccountNo },
          inverseOperation
        );
        walletTransaction = await WalletTransaction.create({
          user: wallet.user,
          payout: meta.payoutId,
          amount: positiveAmount,
          type: type,
          operationType: meta.operationType,
          reference: reference,
        })!;
      }

      if (walletTransaction?.payout) {
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
        });
      }

      walletTransaction = await walletTransaction!.populate(
        "user",
        "_id firstname lastname username email geoData"
      )!;

      walletNotification =
        await WalletNotificationService.createCreditNotification(
          wallet,
          walletTransaction!
        );

      rollbackActions.push(async () => {
        walletTransaction!.operationType = "debit";
        walletNotification =
          await WalletNotificationService.createDebitNotification(
            wallet,
            walletTransaction!
          );
      });
      rollBackId = randomUUID();
      registerRollback(rollBackId, "NOTIFICATION", "Notification", {
        wallet,
        walletTransaction,
      });
      payout.status = "Completed";
      payout.payoutDate = new Date();
      await payout.save();

      console.log("Wallet operations completed successfully.");
    } catch (error: any) {
      console.error("Error occurred:", error.message);
      // Perform rollback actions
      await processRollbacks();
    }
  }

  private static async walletDirectTopUp(
    type: string,
    amount: number,
    meta: ItopUps
  ) {
    let rollbackActions = []; // To store rollback operations
    let walletTransaction: IWalletTransaction | null = null;
    let walletNotification: any = null;
    const reference = generateReferenceCode("WDT-");

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

      // if (1 < 2) {
      //   throw new Error("Just a test error");
      // }

      if (wallet) {
        // Add rollback for debit (re-add the amount if something goes wrong later)
        let inverseOperation = { $inc: { balance: positiveAmount } };
        if (meta.operationType === "credit") {
          inverseOperation = { $inc: { balance: -1 * positiveAmount } }; // Debit Operation
        }

        rollbackActions.push(async () => {
          await Wallet.findOneAndUpdate(
            { walletAccountNo: meta.walletAccountNo },
            inverseOperation,
            { new: true }
          );
        });
        walletTransaction = await WalletTransaction.create({
          user: wallet.user,
          amount: positiveAmount,
          type: type,
          operationType: meta.operationType,
          reference: reference,
        })!;
      }

      walletTransaction = await walletTransaction!.populate(
        "user",
        "_id firstname lastname username email geoData"
      )!;

      walletNotification =
        await WalletNotificationService.createCreditNotification(
          wallet,
          walletTransaction!
        );

      rollbackActions.push(async () => {
        walletTransaction!.operationType = "debit";
        walletNotification =
          await WalletNotificationService.createDebitNotification(
            wallet,
            walletTransaction!
          );
      });

      console.log("Wallet direct top completed successfully.");
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
      await WalletFailedtasksHandler.registerfailedJob(type, amount, meta);
    }
  }

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
      // Add rollback for debit (re-add the amount if something goes wrong later)
      let inverseOperation = { $inc: { balance: -1 * positiveAmount } };
      if (meta.operationType === "debit") {
        inverseOperation = { $inc: { balance: positiveAmount } }; // Credit Operation
      }
      const wallet = await Wallet.findOneAndUpdate(
        { walletAccountNo: meta.walletAccountNo },
        operation,
        { new: true } // Return the updated document
      );

      rollbackActions.push(async () => {
        await Wallet.findOneAndUpdate(
          { walletAccountNo: meta.walletAccountNo },
          inverseOperation,
          { new: true }
        );
      });

      if (!wallet) {
        throw new Error("No wallet was fund for account number.");
      }

      if (meta.operationType === "debit") {
        if (wallet.balance < positiveAmount) {
          throw new Error("Insufficient balance in wallet");
        }
      }

      // if (20 > 10) {
      //   throw new Error("Error to test rollback mechanism");
      // }

      if (wallet) {
        walletTransaction = await WalletTransaction.create({
          user: wallet.user,
          amount: positiveAmount,
          type: type,
          operationType: meta.operationType,
          reference: reference,
        })!;
      }

      walletTransaction = await walletTransaction!.populate(
        "user",
        "_id firstname lastname username email geoData"
      )!;

      // Add rollback for debit (re-add the amount if something goes wrong later)
      if (meta.operationType === "debit") {
        walletNotification =
          await WalletNotificationService.createDebitNotification(
            wallet,
            walletTransaction!
          );
      }
      // rollbackActions.push(() =>
      //   WalletTransaction.deleteOne({
      //     _id: walletTransaction!._id,
      //   })
      // );

      // rollbackActions.push(async () => {
      //   NotificationModel.deleteOne({
      //     _id: walletNotification!._id,
      //   });
      //   walletNotification =
      //     await WalletNotificationService.createCreditNotification(
      //       wallet,
      //       walletTransaction!
      //     );
      // });
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
      console.log("Meta afer rolback ", meta);
      meta.uuid = randomUUID();
      await WalletFailedtasksHandler.registerfailedJob(type, amount, meta);
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
