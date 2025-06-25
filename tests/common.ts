import jwthelper from "../src/helpers/jwt_helper";
import Accounts from "../src/models/accounts.model";
import "../src/bootstrap/init.mongo";
import request from "supertest";
import app from "../src/bootstrap/_app";
import logger from "../src/bootstrap/logger";
import { WalletService } from "../src/services/v1/wallet/wallet.service";
import { Wallet } from "../src/models/wallet.model";

interface User {
  email: string;
  password: string;
  token?: string | null;
  wallet?: any;
}
const defaultBalance: number = 4000;

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const exchangeRate = (userTransferPayload: any) => {
  if (
    userTransferPayload.sourceCurrency == "USD" &&
    userTransferPayload.targetCurrency == "GHS"
  ) {
    return 15.3;
  }
  if (
    userTransferPayload.sourceCurrency == "USD" &&
    userTransferPayload.targetCurrency == "ZAR"
  ) {
    return 18.5;
  }
  if (
    userTransferPayload.sourceCurrency == "ZAR" &&
    userTransferPayload.targetCurrency == "USD"
  ) {
    return 0.054;
  }
  if (
    userTransferPayload.sourceCurrency == "GHS" &&
    userTransferPayload.targetCurrency == "ZAR"
  ) {
    return 1.2;
  }
  return 1.0;
};

export const serverUrl: string = process.env.CRYGOCA_SERVER_URL! || "http://localhost:8000";
export const CREDENTIALS: Record<string, User> = {
  user1: {
    email: "ekoemmanuelgodcoder@gmail.com",
    password: "@10111011qweQWE",
  },
  user2: {
    email: "ekoemmanueljavl@gmail.com",
    password: "@10111011qweQWE",
  },
  user3: {
    email: "maranbu@yahoo.com",
    password: "@10111011qweQWE",
  },
};

export function getRandomUserPair(): { sender: User; recipient: User } {
  const users = Object.values(CREDENTIALS);
  
  if (users.length < 2) {
    throw new Error("At least two users are required for a transfer.");
  }

  let senderIndex = Math.floor(Math.random() * users.length);
  let recipientIndex;

  do {
    recipientIndex = Math.floor(Math.random() * users.length);
  } while (recipientIndex === senderIndex);

  return {
    sender: users[senderIndex],
    recipient: users[recipientIndex],
  };
}

export const getLoginToken = async (email: string, password: string) => {
  const account = await Accounts.findOne({ email: email });
  if (!account) {
    return null;
  }
  const isMatch = await account.isValidPassword(password);
  if (!isMatch) return null;

  const accessToken = await jwthelper.signAccessToken(account.id);
  const refreshToken = await jwthelper.signRefreshToken(account.id);
  return { status: true, data: account, accessToken, refreshToken };
};

export const makeTransfer = async (transferPayloads: any[]) => {
  const responses = await Promise.all(
    transferPayloads.map(async (payload) => {
      if (payload.createOtp) {
        await sendTransferOtp(payload.token, {
          walletToDebit: payload.debitDetails.walletAccountNo,
          walletToCredit: payload.creditDetails.walletAccountNo,
        });
        payload.otp = "1234";
      }
      logger.info(`OTP payload ${JSON.stringify({
        walletToDebit: payload.debitDetails.walletAccountNo,
        walletToCredit: payload.creditDetails.walletAccountNo,
      },null, 2)}`)
      await delay(2000)
      return await sendTransferRequest(payload);
    })
  );
  return responses;
};

export const sendTransferOtp = async (token: string, payload: any) => {
  try {
    const response = await fetch(
      `${serverUrl}/api/v1/wallet/send-transfer-otp`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );
    const data = await response.json();
    logger.info(`Transfer OTP Send Response ${JSON.stringify(data, null, 2)}`)
    return data;
  } catch (error: any) {
    logger.error("Otp send failed:" + error.toString());
  }
};

export const sendTransferRequest = async (payload: any) => {
  try {
    const response = await fetch(
      `${serverUrl}/api/v1/wallet/transfer-to-wallet`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${payload.token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    logger.info("Transfer response:" + JSON.stringify(data, null, 2));
    return data;
  } catch (error: any) {
    logger.error("Transfer failed:" + error.toString());
  }
};

export const getCredentialByProperty = (email: string) => {
  const userKey: any = Object.keys(CREDENTIALS).find(
    (key) => CREDENTIALS[key as keyof typeof CREDENTIALS].email === email
  );

  if (userKey) {
    return CREDENTIALS[userKey];
  } else {
    return null;
  }
};

export const updateCredentialProperty = (
  email: string,
  property: keyof User,
  value: any
) => {
  const userKey = Object.keys(CREDENTIALS).find(
    (key) => CREDENTIALS[key as keyof typeof CREDENTIALS].email === email
  );

  if (userKey) {
    CREDENTIALS[userKey as keyof typeof CREDENTIALS][property] = value;
  } else {
  }
};

export const createWallets = async (email: string) => {
  const account = await Accounts.findOne({ email: email });
  if (!account) {
    return {
      status: false,
      message: "No account found for user",
    };
  }

  if (!account?.geoData?.currency?.code) {
    return {
      status: false,
      message:
        "Failed to create your wallet, please ensure you have updated preferred currency in profile section or try again later!",
    };
  }

  const walletAccountNo: string | undefined = Date.now().toString()
    // await WalletService.generateUniqueAccountNumber(account)!;
  if (!walletAccountNo) {
    return {
      status: false,
      message: "Failed to generate an account number for wallet",
    };
  }
  const wallet: any = await Wallet.create({
    user: account._id,
    walletAccountNo,
    balance: defaultBalance,
    currency: account.geoData.currency.code,
    currencySymbol: account.geoData.currency.symbol,
  });

  if (wallet) {
    account.walletCreated = true;
    await account.save();
    updateCredentialProperty(email, "wallet", wallet);
  }
  return {
    status: true,
    message: "Wallet created successfully.",
    wallet: wallet,
  };
};
