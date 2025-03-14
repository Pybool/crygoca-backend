import mongoose from "mongoose";
import axios from "axios";
import {
  IuserDetails,
  IWalletTransaction,
  WalletTransaction,
} from "../../../models/wallet-transaction.model";
import { IWallet, Wallet } from "../../../models/wallet.model";
import Accounts from "../../../models/accounts.model";
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
import { WalletIncomingPayments } from "../../../models/wallet-incomingpayments.model";
import CryptoListingPurchase from "../../../models/listingPurchase.model";
import VerifiedTransactions from "../../../models/verifiedtransactions.model";
import MerchantAccounts from "../../../models/accounts-merchant.model";
import { updatePaymentConfirmation } from "../listingsServices/cryptolisting.service";
import { WalletExternalTransactions } from "../../../models/wallet-externaltransactions.model";

//For Payout topup and direct topups
export interface ItopUps {
  walletAccountNo?: string;
  operationType?: string;
  payoutId?: mongoose.Types.ObjectId;
  payoutConversionMetrics?: any;
  verifiedTransactionId?: mongoose.Types.ObjectId;
  uuid?: string;
  checkOutId?: string;
}

export class WalletService {
  private static generateRandomAccountNumber(
    account: any,
    isMerchant: boolean = false
  ): string {
    let merchantPrefix: string = "CMR-";
    const areaCode: string = account.geoData.isoCode; // ISO Code (e.g., "180")
    const shortTimestamp: number = Math.floor(Date.now() / 1000); // Current timestamp in seconds
    const walletAccountNo: string = `${merchantPrefix}${areaCode}${shortTimestamp}`;
    if (!isMerchant) {
      merchantPrefix = "";
    }
    return walletAccountNo;
  }

  public static async generateUniqueAccountNumber(
    account: any,
    isMerchant: boolean = false
  ) {
    let unique = false;
    let accountNumber;

    while (!unique) {
      accountNumber = WalletService.generateRandomAccountNumber(
        account,
        isMerchant
      );
      const existingAccount = await Wallet.findOne({ accountNumber });
      if (!existingAccount) {
        unique = true; // Exit the loop if the account number is unique
      }
    }
    return accountNumber;
  }

  public static async createWallet(
    userId: mongoose.Types.ObjectId,
    isMerchant: boolean = false
  ) {
    let userType: "accounts" | "merchantAccounts" = "accounts";
    let account = await Accounts.findOne({ _id: userId });
    if (isMerchant) {
      userType = "merchantAccounts";
      account = await MerchantAccounts.findOne({ _id: userId });
    }

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
      await WalletService.generateUniqueAccountNumber(account, isMerchant)!;
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
      userType: userType,
      isMerchant: isMerchant,
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
    accountId: string | null = null,
    isTransfer: boolean = true
  ) {
    try {
      let myWallet: IWallet | null = null;
      if (accountId) {
        myWallet = await Wallet.findOne({
          user: accountId,
        });
      }
      if (isTransfer) {
        if (myWallet && myWallet?.walletAccountNo == walletId) {
          return {
            status: false,
            message:
              "You cannot make a transfer to your own wallet, you can only transfer to other crygoca wallets",
          };
        }
      }

      const wallet: IWallet | null = await Wallet.findOne({
        walletAccountNo: walletId,
      }).populate({
        path: "user",
        model: "accounts", // Dynamically use the model name
      });

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
    console.log("Payment TYpe ", type);
    if (type === "wallet-transfer") {
      return await WalletService.walletTransfer(
        type,
        amount,
        debitDetails!,
        creditDetails!,
        saveBeneficiary
      );
    } else if (type === "wallet-balance-payment") {
      return await WalletService.walletBalancePayment(
        type,
        amount,
        debitDetails!,
        creditDetails!,
        saveBeneficiary,
        meta
      );
    } else if (type === "external-wallet-balance-payment") {
      return await WalletService.externalWalletBalancePayment(
        type,
        amount,
        debitDetails!,
        creditDetails!,
        saveBeneficiary,
        meta
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

    logger.info("Transfer verification response=====> ", response);

    if (!response.status) {
      throw new Error("Unauthorized transfer attempt");
    }

    logger.info(senderWalletAccountNo, currency, amount, senderWallet);

    if (!senderWallet) {
      throw new Error("Sender has no wallet");
    }

    if (!receiverWallet) {
      throw new Error("Receipient has no wallet");
    }

    if (currency !== senderWallet.currency) {
      throw new Error("Invalid currency for sender's wallet");
    }

    console.log(
      "Sender Wallet & balance ",
      senderWallet.balance,
      amount,
      senderWallet.balance < amount
    );

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
    const session = await mongoose.startSession();
    session.startTransaction(); // Start the transaction

    let rollbackActions: any = []; // To store rollback operations
    let senderWalletTransaction: IWalletTransaction | any = null;
    let receiverWalletTransaction: IWalletTransaction | any = null;
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
        throw new Error("Transfer details could not be verified");
      }

      // Debit operation: Decrease balance for sender
      const senderWallet = await Wallet.findOneAndUpdate(
        { walletAccountNo: senderWalletAccountNo },
        { $inc: { balance: -1 * debitDetails.amount } },
        { session, new: true } // Return the updated document
      );
      if (senderWallet) {
        senderWallet.updatedAt = new Date();
        await senderWallet.save({ session });
      }

      if (!senderWallet) {
        throw new Error("Sender has no wallet");
      }

      senderWalletTransaction = await WalletTransaction.create(
        [
          {
            user: senderWallet!.user,
            creditWalletAccountNo: receiverWalletAccountNo,
            debitWalletAccountNo: senderWalletAccountNo,
            amount: debitDetails.amount,
            type: type,
            operationType: "debit",
            reference: reference,
          },
        ],
        { session } // ✅ Pass session as an option
      );

      senderWalletTransaction = senderWalletTransaction[0];

      await senderWalletTransaction.populate(
        "user",
        "_id firstname lastname username email geoData"
      );

      senderNotification =
        await WalletNotificationService.createDebitNotification(
          senderWallet,
          senderWalletTransaction!
        );

      //Redis Roll back notification...
      let rollBackId: string = randomUUID();
      rollBackId = randomUUID();
      senderWalletTransaction!.operationType = "credit";
      registerRollback(rollBackId, "NOTIFICATION", "Notification", {
        wallet: senderWallet,
        walletTransaction: senderWalletTransaction,
        isRollBack: true,
      });

      // Credit operation: Increase balance for receiver
      const receiverWallet = await Wallet.findOneAndUpdate(
        { walletAccountNo: receiverWalletAccountNo },
        { $inc: { balance: creditDetails.amount } },
        { session, new: true }
      );

      if (!receiverWallet) {
        throw new Error("Receiver wallet not found");
      } else {
        receiverWalletTransaction = await WalletTransaction.create(
          [
            {
              user: receiverWallet.user,
              creditWalletAccountNo: receiverWalletAccountNo,
              debitWalletAccountNo: senderWalletAccountNo,
              amount: creditDetails.amount,
              type: type,
              operationType: "credit",
              reference: reference,
            },
          ],
          { session } // ✅ Pass session as an option);
        );
        receiverWalletTransaction = receiverWalletTransaction[0];

        receiverWalletTransaction = await receiverWalletTransaction.populate(
          "user",
          "_id firstname lastname username email geoData"
        );

        receiverNotification =
          await WalletNotificationService.createCreditNotification(
            receiverWallet,
            receiverWalletTransaction
          );

        //Redis Roll back notification...
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
        }).session(session);

        if (!beneficiary) {
          await WalletBeneficiary.create([beneficiaryData], { session });
        }
      }

      await session.commitTransaction(); // Commit if successful
      logger.info("Wallet operations completed successfully.");
    } catch (error: any) {
      logger.info("Error occurred:" + error?.message);
      await session.abortTransaction(); // Rollback on failure
      processRollbacks();
    } finally {
      session.endSession();
    }
  }

  private static async walletBalancePayment(
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
    saveBeneficiary?: boolean,
    meta?: ItopUps | null
  ) {
    const session = await mongoose.startSession();
    session.startTransaction(); // Start the transaction
    let rollbackActions: any = []; // To store rollback operations
    let senderWalletTransaction: IWalletTransaction | any = null;
    let receiverWalletTransaction: IWalletTransaction | any = null;
    let senderNotification: any = null;
    let receiverNotification: any = null;
    const senderWalletAccountNo: string = debitDetails.walletAccountNo;
    const receiverWalletAccountNo: string = creditDetails.walletAccountNo;

    if (!meta) {
      throw new Error("No order reference for payment was detected...");
    }

    try {
      const senderWalletCurrency: string = debitDetails.currency;
      const reference = generateReferenceCode("CWP-");

      // Debit operation: Decrease balance for sender
      const senderWallet = await Wallet.findOneAndUpdate(
        { walletAccountNo: senderWalletAccountNo },
        { $inc: { balance: -1 * debitDetails.amount } },
        { session, new: true } // Return the updated document
      );
      if (senderWallet) {
        senderWallet.updatedAt = new Date();
        await senderWallet.save({ session });
      }

      let rollBackId: string = randomUUID();

      if (!senderWallet) {
        throw new Error("Sender has no wallet");
      }

      senderWalletTransaction = await WalletTransaction.create(
        [
          {
            user: senderWallet.user,
            creditWalletAccountNo: receiverWalletAccountNo,
            debitWalletAccountNo: senderWalletAccountNo,
            amount: debitDetails.amount,
            type: type,
            operationType: "debit",
            reference: reference,
          },
        ],
        { session }
      );

      senderWalletTransaction = senderWalletTransaction[0];

      await senderWalletTransaction.populate(
        "user",
        "_id firstname lastname username email geoData"
      );

      senderNotification =
        await WalletNotificationService.createDebitNotification(
          senderWallet,
          senderWalletTransaction,
          false,
          true
        );
      //Redis Roll back...
      rollBackId = randomUUID();
      senderWalletTransaction!.operationType = "credit";
      registerRollback(rollBackId, "NOTIFICATION", "Notification", {
        wallet: senderWallet,
        walletTransaction: senderWalletTransaction,
        isRollBack: true,
      });

      const receiverWallet = await Wallet.findOne({
        walletAccountNo: receiverWalletAccountNo,
      }).populate({
        path: "user",
        model: "accounts",
      });

      if (!receiverWallet) {
        throw new Error("Receiver wallet not found");
      }
      // Credit operation: Increase balance for receiver
      const incomingpaymentData = {
        wallet: receiverWallet._id,
        checkOutId: meta.checkOutId,
        status: "PENDING",
        amount: creditDetails.amount,
        debitWalletAccountNo: senderWalletAccountNo,
      };
      let walletIncomingPayment: any = await WalletIncomingPayments.create(
        [incomingpaymentData],
        { session }
      );

      walletIncomingPayment = walletIncomingPayment[0];

      receiverNotification =
        await WalletNotificationService.createIncomingPaymentNotification(
          receiverWallet,
          walletIncomingPayment
        );

      //Redis Roll back...
      rollBackId = randomUUID();
      registerRollback(rollBackId, "NOTIFICATION", "Notification", {
        wallet: receiverWallet,
        walletTransaction: receiverWalletTransaction,
        isRollBack: true,
      });
      const accountId = senderWallet.user;
      const account = await Accounts.findOne({ _id: accountId }).session(
        session
      );

      const paymentData = {
        tx_ref: meta.checkOutId,
        amount: creditDetails.amount,
        currency: senderWallet.currency,
        charged_amount: creditDetails.amount,
        app_fee: 0.0,
        status: "successful",
        payment_type: "crygoca-wallet",
      };

      let verifiedTransaction: any = await VerifiedTransactions.create(
        [
          {
            tx_ref: meta.checkOutId,
            data: paymentData,
            account: account._id,
            paymentProcessor: "CRYGOCA",
          },
        ],
        { session }
      );
      verifiedTransaction = verifiedTransaction![0];
      const cryptoPurchase = await CryptoListingPurchase.findOne(
        { checkOutId: verifiedTransaction.tx_ref },
        null, // Projection (keep `null` if not needed)
        { session } // ✅ Pass session correctly
      );
      if (cryptoPurchase) {
        cryptoPurchase.verifiedTransaction = verifiedTransaction._id;
        cryptoPurchase.paymentConfirmed = true;
        await cryptoPurchase.save({ session });
      }

      await updatePaymentConfirmation(verifiedTransaction.tx_ref);
      await session.commitTransaction(); // Commit if successful
      logger.info("Wallet balance payment operations completed successfully.");
    } catch (error: any) {
      logger.info(error?.toString());
      logger.info("Error occurred:" + error?.message);
      await session.abortTransaction(); // Rollback on failure
      await processRollbacks();
    } finally {
      session.endSession();
    }
  }

  private static async externalWalletBalancePayment(
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
    saveBeneficiary?: boolean,
    meta?: ItopUps | null
  ) {
    const session = await mongoose.startSession();
    session.startTransaction(); // Start the transaction
    let rollbackActions: any = []; // To store rollback operations
    let senderWalletTransaction: IWalletTransaction | any = null;
    let receiverWalletTransaction: IWalletTransaction | any = null;
    let senderNotification: any = null;
    let receiverNotification: any = null;
    const senderWalletAccountNo: string = debitDetails.walletAccountNo;
    const receiverWalletAccountNo: string = creditDetails.walletAccountNo;

    try {
      const walletTx = await WalletExternalTransactions.findOne({
        txRef: meta!.checkOutId,
      });
      if (!walletTx) {
        throw new Error("No transaction found for transaction reference");
      }
      const senderWalletCurrency: string = debitDetails.currency;
      const reference = generateReferenceCode("CWT-");

      const _senderWallet: IWallet | null = await Wallet.findOne({
        walletAccountNo: senderWalletAccountNo,
      });

      const _receiverWallet: IWallet | null = await Wallet.findOne({
        walletAccountNo: receiverWalletAccountNo,
      });

      if (!_senderWallet) {
        return {
          status: false,
          message: "No wallet was found for customer",
        };
      }

      if (!_receiverWallet) {
        return {
          status: false,
          message: "No wallet was found for merchant",
        };
      }

      // Debit operation: Decrease balance for sender
      const senderWallet = await Wallet.findOneAndUpdate(
        { walletAccountNo: senderWalletAccountNo },
        { $inc: { balance: -1 * debitDetails.amount } },
        { session, new: true } // Return the updated document
      );
      if (senderWallet) {
        senderWallet.updatedAt = new Date();
        await senderWallet.save({ session });
      }

      // Add rollback for debit (re-add the amount if something goes wrong later)

      let rollBackId: string = randomUUID();
      if (!senderWallet) {
        throw new Error("Sender has no wallet");
      }

      senderWalletTransaction = await WalletTransaction.create(
        [
          {
            user: senderWallet.user,
            creditWalletAccountNo: receiverWalletAccountNo,
            debitWalletAccountNo: senderWalletAccountNo,
            amount: debitDetails.amount,
            type: type,
            operationType: "debit",
            reference: reference,
          },
        ],
        { session }
      );

      senderWalletTransaction = senderWalletTransaction[0];

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

      // Credit operation: Increase balance for receiver
      const receiverWallet = await Wallet.findOneAndUpdate(
        {
          walletAccountNo: receiverWalletAccountNo,
          userType: "merchantAccounts",
        },
        { $inc: { balance: creditDetails.amount } },
        { session, new: true }
      ).populate({
        path: "user",
        model: "merchantAccounts",
      });

      walletTx.status = "SUCCESS";
      await walletTx.save({ session });

      if (!receiverWallet) {
        throw new Error("Receiver wallet not found");
      } else {
        receiverWalletTransaction = await WalletTransaction.create(
          [
            {
              user: receiverWallet.user,
              creditWalletAccountNo: receiverWalletAccountNo,
              debitWalletAccountNo: senderWalletAccountNo,
              amount: creditDetails.amount,
              type: type,
              operationType: "credit",
              reference: reference,
            },
          ],
          { session }
        );

        receiverWalletTransaction = receiverWalletTransaction[0];

        receiverWalletTransaction = await receiverWalletTransaction.populate(
          "user",
          "_id firstname lastname username email geoData"
        );

        receiverWalletTransaction.user = receiverWallet.user;

        receiverNotification =
          await WalletNotificationService.createExternalPaymentCreditNotification(
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
          await WalletBeneficiary.create([beneficiaryData], { session });
        }
      }

      await session.commitTransaction(); // Commit if successful
      logger.info("Wallet operations completed successfully.");
    } catch (error: any) {
      await session.abortTransaction(); // Rollback on failure
      logger.info("Error occurred:" + error?.message);
      await processRollbacks();
    } finally {
      session.endSession();
    }
  }

  private static async walletPayoutTopUp(
    type: string,
    amount: number,
    meta: ItopUps
  ) {
    const session = await mongoose.startSession();
    session.startTransaction(); // Start the transaction
    let rollbackActions = []; // To store rollback operations
    let walletTransaction: IWalletTransaction | any = null;
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
        { session, new: true } // Return the updated document
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

        walletTransaction = await WalletTransaction.create(
          [
            {
              user: wallet.user,
              payout: meta.payoutId,
              amount: positiveAmount,
              type: type,
              operationType: meta.operationType,
              reference: reference,
            },
          ],
          { session }
        )!;
      }

      walletTransaction = walletTransaction[0];

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

      rollBackId = randomUUID();
      registerRollback(rollBackId, "NOTIFICATION", "Notification", {
        wallet,
        walletTransaction,
      });
      payout.status = "Completed";
      payout.payoutDate = new Date();
      await payout.save({ session });
      await session.commitTransaction(); // Commit if successful
      logger.info("Wallet operations completed successfully.");
    } catch (error: any) {
      logger.error("Error occurred:", error.message);
      await session.abortTransaction(); // Rollback on failure
      await processRollbacks();
    } finally {
      session.endSession();
    }
  }

  private static async walletDirectTopUp(
    type: string,
    amount: number,
    meta: ItopUps
  ) {
    const session = await mongoose.startSession();
    session.startTransaction(); // Start the transaction
    let rollbackActions = []; // To store rollback operations
    let walletTransaction: IWalletTransaction | any = null;
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
        { session, new: true } // Return the updated document
      );

      if (!wallet) {
        throw new Error("No wallet was found for account number.");
      }

      if (wallet) {
        walletTransaction = await WalletTransaction.create(
          [
            {
              user: wallet.user,
              amount: positiveAmount,
              type: type,
              operationType: meta.operationType,
              reference: reference,
            },
          ],
          { session }
        )!;
      }

      walletTransaction = walletTransaction[0];

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
      await session.commitTransaction(); // Commit if successful
      logger.info("Wallet direct top completed successfully.");
    } catch (error: any) {
      await session.abortTransaction(); // Rollback on failure
      logger.error("Error occurred:", error.message);
      for (const rollback of rollbackActions) {
        try {
          await rollback(); // Execute each rollback operation
        } catch (rollbackError: any) {
          logger.info("Rollback failed:", rollbackError.message);
        }
      }
      logger.info("All operations were rolled back.");
    } finally {
      session.endSession();
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
    const session = await mongoose.startSession();
    session.startTransaction(); // Start the transaction
    let rollbackActions: any = []; // To store rollback operations
    let walletTransaction: IWalletTransaction | any = null;
    let walletNotification: any = null;
    const reference = generateReferenceCode("CWW-");

    try {
      const positiveAmount = Math.abs(amount);
      let operation = { $inc: { balance: positiveAmount } }; // Credit Operation
      if (meta.operationType === "debit") {
        operation = { $inc: { balance: -1 * positiveAmount } }; // Debit Operation
      }

      //The two blocks below may be unneccessary as validation was done in controller.
      const _wallet = await Wallet.findOne({
        walletAccountNo: meta.walletAccountNo,
      });
      if (!_wallet) {
        throw new Error("No source wallet was found..");
      }

      if (meta.operationType === "debit") {
        if (_wallet.balance < positiveAmount) {
          throw new Error("Insufficient balance in wallet");
        }
      }

      const wallet = await Wallet.findOneAndUpdate(
        { walletAccountNo: meta.walletAccountNo },
        operation,
        { session, new: true } // Return the updated document
      );

      if (!wallet) {
        throw new Error("No wallet was fund for account number.");
      }

      if (wallet) {
        walletTransaction = await WalletTransaction.create(
          [
            {
              user: wallet.user,
              amount: positiveAmount,
              type: type,
              operationType: meta.operationType,
              reference: reference,
            },
          ],
          { session }
        )!;
      }

      walletTransaction = walletTransaction[0];

      walletTransaction = await walletTransaction!.populate(
        "user",
        "_id firstname lastname username email geoData"
      )!;

      if (meta.operationType === "debit") {
        walletNotification =
          await WalletNotificationService.createDebitNotification(
            wallet,
            walletTransaction!
          );
      }
      await session.commitTransaction(); // Commit if successful
      logger.info("Wallet Withdrawal operations completed successfully.");
    } catch (error: any) {
      await session.abortTransaction(); // Rollback on failure

      for (const rollback of rollbackActions) {
        try {
          await rollback(); // Execute each rollback operation
        } catch (rollbackError: any) {
          logger.error("Rollback failed:", rollbackError.message);
        }
      }
      logger.error("All operations were rolled back.");
    } finally {
      session.endSession();
    }
  }

  public static async processToLocalBankWithdrawal(
    type: "wallet-to-bank-withdrawal",
    data: any,
    hash: string,
    accountId: string
  ) {
    const session = await mongoose.startSession();
    session.startTransaction(); // Start the transaction
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
      logger.info("Complete Withdrawal data ===> ", data);
      const withdrawalResponse = await withdrawToLocalBankHandler(data);
      logger.info("WithdrawalResponse ===> ", withdrawalResponse);
      let withdrawal: any = await Withdrawals.create(
        [
          {
            wallet: senderWallet._id,
            account: new mongoose.Types.ObjectId(accountId),
            status: withdrawalResponse.data.status,
            hash: hash,
            reference: data.reference,
            payload: data,
            queuedResponse: withdrawalResponse,
          },
        ],
        { session }
      );

      withdrawal = withdrawal[0];

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
        await session.commitTransaction(); // Commit if successful
      }
    } catch (error: any) {
      await session.abortTransaction(); // Rollback on failure
      logger.info("Withdrawal error ", error?.message);
    } finally {
      session.endSession();
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
    } catch (error) { }
  }

  public static async makeExternalPayment(payload: {
    amount: number;
    authorizationPin: number | string;
    orderId: string;
    paymentHash: string;
  }) {
    const url = `${process.env.CRYGOCA_SERVER_URL}/api/v1/wallet/create-payment`;
    console.log(
      "process.env.CRYGOCA_SECRET_KEY ",
      process.env.CRYGOCA_SECRET_KEY
    );
    try {
      const response = await axios.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": `${process.env.CRYGOCA_SECRET_KEY!}`, // Add token if available
        },
      });

      return { code: response.status, data: response.data };
    } catch (error: any) {
      console.error(
        "Error processing wallet payment:",
        error.response?.data || error.message
      );
      return {
        message: "Error processing wallet payment",
        error: error.response?.data || error.message,
      };
    }
  }
}
