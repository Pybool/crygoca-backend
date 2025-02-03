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
  const {
    debitDetails,
    creditDetails,
    sourceAmount,
    sourceCurrency,
    targetCurrency,
    saveBeneficiary,
    otp
  } = req.body;
  let amount: number = 0.0;

  try {
    console.log("Transfer otp from test ", otp)
    const validatedSenderWallet = await WalletService.validateTransfer(
      debitDetails.walletAccountNo,
      creditDetails.walletAccountNo,
      sourceCurrency,
      sourceAmount,
      otp
    );

    if (!validatedSenderWallet) {
      return res.status(400).json({
        status: false,
        message: "Failed to validate transaction",
      });
    }
  } catch (error: any) {
    return res.status(400).json({
      status: false,
      message: error.message,
    });
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
      return res.status(422).json({
        status: false,
        message: "Currency conversion failed, please try again later!",
      });
    }
    amount = sourceAmount * exchangeRate;
    creditDetails.amount = amount; //Converted Amount
    creditDetails.currency = targetCurrency;

    debitDetails.amount = sourceAmount; // Source/Raw amount
    debitDetails.currency = sourceCurrency;
  }
  debitDetails.otp = otp;
  try {
    const meta: ItopUps | null = null;
    const transferId: string = `${debitDetails.accountNumber}-${creditDetails.accountNumber}`;
    await addWalletBalanceUpdateJob(
      "wallet-transfer",
      amount,
      meta,
      transferId,
      debitDetails,
      creditDetails,
      saveBeneficiary
    );
    res
    .status(200)
    .json({ status: true, message: "Transaction queued successfully" });
  } catch (error: any) {
    res.status(500).json({ status: false, error: error.message });
  }
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

    const walletResponse: {
      status: boolean;
      message: string;
      wallet?: IWallet;
    } = await WalletService.getReceipientWallet(walletId, accountId);
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
}
