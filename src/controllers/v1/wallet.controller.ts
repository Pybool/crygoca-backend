import { Request, Response } from "express";
import {
  addWalletBalanceUpdateJob,
  addWalletWithdrawalJob,
} from "../../services/v1/tasks/wallet/transfers.queue";
import Xrequest from "../../interfaces/extensions.interface";
import {
  ItopUps,
  WalletService,
} from "../../services/v1/wallet/wallet.service";
import { convertCurrency } from "../../services/v1/conversions/comparison.service";
import { getCountryCodeByCurrencyCode } from "../../models/countries";
import { IWallet, Wallet } from "../../models/wallet.model";
import Accounts from "../../models/accounts.model";
import { WalletAuthorization } from "../../services/v1/wallet/wallet-authorizations.service";
import { WalletFundingService } from "../../services/v1/wallet/wallet-funding.service";
import mongoose from "mongoose";
import MerchantAccounts from "../../models/accounts-merchant.model";

const makeTransfer = async (payload: any) => {
  const {
    debitDetails,
    creditDetails,
    sourceAmount,
    sourceCurrency,
    targetCurrency,
    saveBeneficiary,
    otp,
    jobType,
    orderId
  } = payload;

  let amount: number = 0.0;

  try {
    console.log("Transfer otp from test ", otp);
    if (jobType === "wallet-transfer") {
      const validatedSenderWallet = await WalletService.validateTransfer(
        debitDetails.walletAccountNo,
        creditDetails.walletAccountNo,
        sourceCurrency,
        sourceAmount,
        otp
      );

      if (!validatedSenderWallet) {
        return {
          status: false,
          message: "Failed to validate transaction",
          code: 400
        };
      }
    }

  } catch (error: any) {
    return {
      status: false,
      message: error.message,
      code: 500
    };
  }

  if (sourceCurrency === targetCurrency) {
    amount = sourceAmount;
  } else {
    /* Convert source currency to target currency */
    const from = getCountryCodeByCurrencyCode(
      sourceCurrency.toUpperCase()
    )!.code;

    const to = getCountryCodeByCurrencyCode(targetCurrency.toUpperCase())!.code;
    const convertToDefaultCurrency = async (amount: number) => {
      if (from && to && sourceCurrency && targetCurrency) {
        return await convertCurrency(
          from,
          to,
          sourceCurrency,
          targetCurrency,
          amount?.toString()
        );
      }
      return null;
    };

    const exchangeRateData: any = await convertToDefaultCurrency(1);
    const exchangeRate: any =
      exchangeRateData?.data?.data[targetCurrency.toUpperCase()]?.value;
    if (!exchangeRate) {
      return {
        status: false,
        message: "Currency conversion failed, please try again later!",
        code: 422
      };
    }
    amount = sourceAmount * exchangeRate;
    creditDetails.amount = amount; //Converted Amount
    creditDetails.currency = targetCurrency;

    debitDetails.amount = sourceAmount; // Source/Raw amount
    debitDetails.currency = sourceCurrency;
  }
  debitDetails.otp = otp;
  try {
    let meta: ItopUps | null = null;
    if (jobType === "wallet-balance-payment") {
      meta = { checkOutId: orderId }
    }
    const transferId: string = `${debitDetails.accountNumber}-${creditDetails.accountNumber}`;
    await addWalletBalanceUpdateJob(
      jobType,
      amount,
      meta,
      transferId,
      debitDetails,
      creditDetails,
      saveBeneficiary
    );
    return { status: true, message: "Transaction queued successfully", code: 200 };
  } catch (error: any) {
    return { status: false, error: error.message, code: 500 };
  }
}

const processExternalPayment = async (payload: any) => {
  const merchantCredentials = payload.merchantCredentials;
  const merchantWallet = await Wallet.findOne({user: merchantCredentials.account})
  .populate({
    path: "user",
    model: "merchantAccounts", // Dynamically use the model name
  });
  if(!merchantWallet){
    return {
      status: false,
      message: "No wallet found for merchant"
    }
  }

  return {
    status: true,
    message: "Transaction completed successfully.",
    data:{
      merchantWallet
    },
    code: 200
  }
}

export const createWallet = async (req: Xrequest, res: Response) => {
  try {
    const accountId = req.accountId;
    const account = await Accounts.findOne({ _id: accountId });
    if (!account) {
      return res.status(400).json({
        status: false,
        message: "No account found for user",
      });
    }
    const walletResponse: {
      status: boolean;
      message: string;
      data?: IWallet | null;
    } = await WalletService.createWallet(account._id);

    if (!walletResponse.status) {
      return res.status(400).json(walletResponse);
    }
    return res.status(200).json({
      status: true,
      message: "Wallet created successfully",
      data: walletResponse.data,
    });
  } catch (error: any) {
    res.status(500).json({ status: false, error: error.message });
  }
};

export const processWalletTransfer = async (req: Xrequest, res: Response) => {
  const payload = req.body;
  payload.jobType = "wallet-transfer";
  const response = await makeTransfer(payload);
  return res.status(response?.code || 200).json(response);
};

export const processWalletToBankWithdrawals = async (
  req: Xrequest,
  res: Response
) => {
  try {
    const { data, hash } = req.body!;
    const accountId: string = req.accountId! as string;
    const hashIsSame: boolean = WalletAuthorization.comparePayloadHashes(
      hash,
      data
    );
    const senderWallet: IWallet | null = await Wallet.findOne({
      user: accountId,
    });

    if (!senderWallet) {
      throw new Error("Sender has no wallet");
    }
    if (senderWallet.balance < data.amount) {
      throw new Error("Insufficient balance in wallet");
    }
    if (!hashIsSame) {
      return res.status(200).json({
        status: false,
        message: "Non-matching/Invalid withdrawal request hash",
      });
    }
    const authorizationResponse =
      await WalletAuthorization.getWithdrawalAuthorization(accountId, hash);

    if (authorizationResponse!?.status) {
      await addWalletWithdrawalJob(
        "wallet-to-bank-withdrawal",
        data,
        hash,
        accountId
      );
      return res
        .status(200)
        .json({ status: true, message: "Withdrawal request is processing" });
    } else {
      return res.status(422).json(authorizationResponse);
    }
  } catch (error: any) {
    res.status(500).json({ status: false, error: error.message });
  }
};

export const getReceipientWallet = async (req: Xrequest, res: Response) => {
  try {
    const walletId: string = req.query.walletId! as string;
    const accountId: string = req.accountId! as string;
    const isTransferStr: string = req.query?.isTransfer! as string;
    let isTransfer: boolean = true;
    if (isTransferStr && isTransferStr === "0") {
      isTransfer = false;
    }

    const walletResponse: {
      status: boolean;
      message: string;
      wallet?: IWallet;
    } = await WalletService.getReceipientWallet(walletId, accountId, isTransfer);
    return res.status(200).json(walletResponse);
  } catch (error: any) {
    res.status(500).json({ status: false, error: error.message });
  }
};

export const getReceipientWalletUid = async (req: Xrequest, res: Response) => {
  try {
    const accountId: string = req.query.accountId! as string;

    const walletResponse: {
      status: boolean;
      message: string;
      wallet?: IWallet;
    } = await WalletService.getWallet(new mongoose.Types.ObjectId(accountId));
    return res.status(200).json(walletResponse);
  } catch (error: any) {
    res.status(500).json({ status: false, error: error.message });
  }
};

export const sendTransferOtp = async (req: Xrequest, res: Response) => {
  try {
    const transferIntent: {
      walletToDebit: string;
      walletToCredit: string;
      amount: string;
      user: any;
    } = req.body!;

    const response = await WalletAuthorization.sendTransferOtp(transferIntent);
    return res.status(200).json(response);
  } catch (error: any) {
    res.status(500).json({ status: false, error: error.message });
  }
};

export const verifyTransferOtp = async (req: Xrequest, res: Response) => {
  try {
    const transferIntentWithCode: {
      walletToDebit: string;
      walletToCredit: string;
      otp: string;
    } = req.body!;

    const response = await WalletAuthorization.verifyTransferOtp(
      transferIntentWithCode
    );
    if (response) {
      return res.status(200).json(response);
    }
    throw new Error("Failed to verify transfer authorization");
  } catch (error: any) {
    res.status(500).json({ status: false, error: error.message });
  }
};

export const sendWithdrawalOtp = async (req: Xrequest, res: Response) => {
  try {
    const payloadHash: string = req.body.payloadHash!;
    const accountId: string = req.accountId! as string;
    const response = await WalletAuthorization.sendWithdrawalOtp(
      accountId,
      payloadHash
    );
    return res.status(200).json(response);
  } catch (error: any) {
    res.status(500).json({ status: false, error: error.message });
  }
};

export const verifyWithdrawalOtp = async (req: Xrequest, res: Response) => {
  try {
    const accountId: string = req.accountId! as string;
    const withdrawalIntent: {
      accountId?: string;
      payloadHash: string;
      otp: string;
    } = req.body!;
    withdrawalIntent.accountId = accountId;

    const response = await WalletAuthorization.verifyWithdrawalOtp(
      withdrawalIntent
    );
    if (response) {
      return res.status(200).json(response);
    }
    throw new Error("Failed to verify transfer authorization");
  } catch (error: any) {
    res.status(500).json({ status: false, error: error.message });
  }
};

export const walletGetBeneficiaries = async (req: Xrequest, res: Response) => {
  try {
    const data = await WalletService.walletGetBeneficiaries(req);
    if (data) {
      return res.status(200).json({
        status: true,
        message: "Beneficiaries fetched successfully.",
        data: data,
      });
    }
    throw new Error("Failed to fetch beneficiaries.");
  } catch (error: any) {
    res.status(500).json({ status: false, error: error.message });
  }
};

export const cardTopUpFundWallet = async (req: Xrequest, res: Response) => {
  try {
    const response = await WalletFundingService.cardTopUpFundWallet(req);
    if (response) {
      return res.status(200).json(response);
    }
    throw new Error("Failed to fund wallet");
  } catch (error: any) {
    res.status(500).json({ status: false, error: error.message });
  }
};

export const sendWalletPaymentAuthorizationPin = async (
  req: Xrequest,
  res: Response
) => {
  try {
    const payloadHash: string = req.body.payloadHash!;
    const checkOutId: string = req.body.checkOutId!;
    const accountId: string = req.accountId! as string || req.body.accountId! as string;
    const response =
      await WalletAuthorization.sendWalletPaymentAuthorizationPin(
        accountId,
        payloadHash,
        checkOutId
      );
    return res.status(200).json(response);
  } catch (error: any) {
    res.status(500).json({ status: false, error: error.message });
  }
};

export const payWithWalletBalance = async (req: Xrequest, res: Response) => {
  try {
    const paymentHash: string = req.body.paymentHash!;
    const checkOutId: string = req.body.orderId!;
    const amount: string = req.body.amount!;
    const authorizationPin: string = req.body.authorizationPin.toString()!;
    const accountId: string = req.accountId! as string || req.body.accountId! as string;
    console.log("Pay with balance payload ===> ", JSON.stringify(req.body, null, 2))
    let response =
      await WalletAuthorization.validateWalletPaymentAuthorizationPin(
        accountId,
        paymentHash,
        authorizationPin,
        checkOutId
      );
    if (response.status) {
      const wallet = await Wallet.findOne({ user: accountId });
      if (!wallet) {
        throw new Error("No wallet found to debit for request.")
      }
      const payload = req.body;
      payload.otp = payload.authorizationPin;
      payload.jobType = "wallet-balance-payment";
      const response = await makeTransfer(payload);
      return res.status(response?.code || 200).json(response);
    }
    return res.status(200).json(response);
  } catch (error: any) {
    res.status(500).json({ status: false, error: error.message });
  }
};

//Example Merchant intergration of the crygoca-pay sdk
export const makeExternalPayment = async (req: Xrequest, res: Response) => {
  try {
    const payload = req.body;
    const response = await WalletService.makeExternalPayment(payload);
    return res.status(response?.code || 200).json(response?.data || { status: false, message: "Operation failed" })
  } catch (error: any) {
    res.status(500).json({ status: false, error: error.message });
  }
}

//Handles integration of crygoca-pay sdk, called by above method.
export const externalPaymentProcessing = async (req: Xrequest, res: Response) => {
  try {
    const paymentHash: string = req.body.paymentHash!;
    const checkOutId: string = req.body.orderId!;
    const amount: string = req.body.amount!;
    const authorizationPin: string = req.body.authorizationPin.toString()!;
    const accountId: string = req.accountId! as string || req.body.accountId! as string;
    console.log("Pay with balance payload ===> ", JSON.stringify(req.body, null, 2));
    let response =
      await WalletAuthorization.validateWalletPaymentAuthorizationPin(
        accountId,
        paymentHash,
        authorizationPin,
        checkOutId
      );
    if (response.status) {
      const wallet = await Wallet.findOne({ user: accountId });
      if (!wallet) {
        throw new Error("No wallet found to debit for request.")
      }
      const payload = req.body;
      payload.otp = payload.authorizationPin;
      payload.jobType = "external-wallet-balance-payment";
      payload.merchantCredentials = req.merchantCredentials;
      const response = await processExternalPayment(payload);
      return res.status(response?.code || 200).json(response);
    }
    return res.status(200).json(response);
  } catch (error: any) {
    res.status(500).json({ status: false, error: error.message });
  }
};
