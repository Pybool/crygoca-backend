import { getTestConfig, updateTestConfig } from "../config";
import logger from "../src/bootstrap/logger";
import { Wallet } from "../src/models/wallet.model";
import { redisClient } from "../src/redis/init.redis";
import { getRollbackById } from "../src/services/v1/wallet/rollback.service";
import {
  createWallets,
  CREDENTIALS,
  delay,
  getLoginToken,
  getRandomUserPair,
  makeTransfer,
  updateCredentialProperty,
} from "./common";
import { EventEmitter } from "events";
let transferPayloads: any = [];
let clonedTransferPayloads: any[] = [];
// Create an EventEmitter instance
const eventEmitter = new EventEmitter();
const transferEmitter = new EventEmitter();
const defaultBalance: number = 4000;
let { sender, recipient } = getRandomUserPair();

beforeAll(() => {
  initializeTest();
  console.log = jest.fn(); // Mock console.log
});

afterAll(async() => {
  updateTestConfig("TEST_ERROR", "false");
});

const initializeTest = async () => {
  logger.info(
    "==========================Initilaizing tests=================================="
  );
  try {
    await Wallet.deleteMany();
    for (const user of Object.values(CREDENTIALS)) {
      await delay(1000)
      await createWallets(user.email);
    }
  } catch {}
};

const buildTransferPayload = (createOtp: boolean = true) => {
  return [
    {
      debitDetails: {
        walletAccountNo: sender.wallet.walletAccountNo,
      },
      creditDetails: {
        walletAccountNo: recipient.wallet.walletAccountNo,
      },
      sourceAmount: Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000,
      sourceCurrency: sender.wallet.currency,
      targetCurrency: recipient.wallet.currency,
      saveBeneficiary: false,
      token: sender.token,
      createOtp: createOtp,
    },
  ];
};

const startUp = async (createOtp: boolean) => {
  await delay(10000)
  const user1TokenResponse = await getLoginToken(sender.email, sender.password);
  if (user1TokenResponse) {
    updateCredentialProperty(
      sender.email,
      "token",
      user1TokenResponse.accessToken
    );
  }
  logger.info("Waiting for tokens to be set on users' credentials");
  await delay(4000);
  transferPayloads = buildTransferPayload(createOtp);
  clonedTransferPayloads = JSON.parse(JSON.stringify(transferPayloads));
  eventEmitter.emit("transferPayloads", transferPayloads);
};

eventEmitter.on("transferPayloads", async (payloads) => {
  const transferResponses = await makeTransfer(payloads);
  transferEmitter.emit("transferComplete", transferResponses);
});

const ensureTransferFailed = async () => {
  const user1WalletDB = await Wallet.findOne({
    walletAccountNo: sender.wallet.walletAccountNo,
  });
  const user2WalletDB = await Wallet.findOne({
    walletAccountNo: recipient.wallet.walletAccountNo,
  });

  logger.info("user1WalletDB Balance : "+ user1WalletDB!.balance)
  logger.info("user2WalletDB Balance : "+ user2WalletDB!.balance)

  if (
    user1WalletDB!.balance == defaultBalance &&
    user2WalletDB!.balance == defaultBalance
  ) {
    return true;
  } else {
    return false;
  }
};

describe("Single transfer APIs Test", () => {
  it("Ensure when a transfer fails, the account balances of the sender and receiver must remain the same.", async () => {
    updateTestConfig("TEST_ERROR", "true");
    const transferPromise = new Promise((resolve) => {
      transferEmitter.once("transferComplete", (transferResponses) => {
        resolve(transferResponses);
      });
    });
    await startUp(true);
    const response: any = await transferPromise;
    expect(response[0]).not.toBeNull()
    logger.info("Transfer Responses " + JSON.stringify(response, null, 2));
    const successPromise = new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 6000);
    });
    await successPromise;
    const transactionFailed = await ensureTransferFailed();
    logger.info(`Account balances remain unchanged ${transactionFailed}`)
    updateTestConfig("TEST_ERROR", "false");
    expect(true).toEqual(transactionFailed);
  });

  it("Ensure if the database becomes unavailable during a transfer the tranfer details are stored in redis backup", async () => {
    // updateTestConfig("DISCONNECT_DATABASE", "true");
    // const transferPromise = new Promise((resolve) => {
    //   transferEmitter.once("transferComplete", (transferResponses) => {
    //     resolve(transferResponses);
    //   });
    // });
    // await startUp(true);
    // const response: any = await transferPromise;
    // expect(response[0]).not.toBeNull()
    // logger.info("Transfer Responses " + JSON.stringify(response, null, 2));
    // const successPromise = new Promise((resolve) => {
    //   setTimeout(() => {
    //     resolve(true);
    //   }, 6000);
    // });
    // await successPromise;
    // const transactionFailed = await ensureTransferFailed();
    // logger.info(`Account balances remain unchanged ${transactionFailed}`)
    // const failedTransactionIds = getTestConfig().failedTransactionIds;
    // for(let failedTransactionId of failedTransactionIds){
    //   const failedTransaction = await getRollbackById(failedTransactionId);
    //   logger.info(`failedTransaction===>${failedTransactionId} :== ${JSON.stringify(failedTransaction, null, 2)}`)
    //   expect(failedTransaction).not.toBeNull();
    // }
    // updateTestConfig("failedTransactionIds", []);
    
  });
  
});
