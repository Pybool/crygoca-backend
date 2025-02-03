import logger from "../src/bootstrap/logger";
import {
  createWallets,
  CREDENTIALS,
  delay,
  exchangeRate,
  getLoginToken,
  makeTransfer,
  updateCredentialProperty,
} from "./common";
import { Wallet } from "../src/models/wallet.model";
import { EventEmitter } from "events";

// Create an EventEmitter instance
const eventEmitter = new EventEmitter();
const transferEmitter = new EventEmitter();

const defaultBalance: number = 4000;
let transferPayloads: any = [];
let clonedTransferPayloads: any[] = [];

beforeAll(() => {
  initializeTest();
  console.log = jest.fn(); // Mock console.log
});

const initializeTest = async () => {
  logger.info(
    "==========================Initilaizing tests=================================="
  );
  try {
    await Wallet.deleteMany();
    await delay(4000)
    for (const user of Object.values(CREDENTIALS)) {
      await createWallets(user.email);
    }
  } catch {
    
  }
};

const buildTransferPayload = (createOtp: boolean = true) => {
  return [
    {
      debitDetails: {
        walletAccountNo: CREDENTIALS.user1.wallet.walletAccountNo,
      },
      creditDetails: {
        walletAccountNo: CREDENTIALS.user2.wallet.walletAccountNo,
      },
      sourceAmount: Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000,
      sourceCurrency: CREDENTIALS.user1.wallet.currency,
      targetCurrency: CREDENTIALS.user2.wallet.currency,
      saveBeneficiary: false,
      token: CREDENTIALS.user1.token,
      createOtp: createOtp,
    },
    {
      debitDetails: {
        walletAccountNo: CREDENTIALS.user2.wallet.walletAccountNo,
      },
      creditDetails: {
        walletAccountNo: CREDENTIALS.user3.wallet.walletAccountNo,
      },
      sourceAmount: Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000,
      sourceCurrency: CREDENTIALS.user2.wallet.currency,
      targetCurrency: CREDENTIALS.user3.wallet.currency,
      saveBeneficiary: false,
      token: CREDENTIALS.user2.token,
      createOtp: createOtp,
    },
    {
      debitDetails: {
        walletAccountNo: CREDENTIALS.user3.wallet.walletAccountNo,
      },
      creditDetails: {
        walletAccountNo: CREDENTIALS.user1.wallet.walletAccountNo,
      },
      sourceAmount: Math.floor(Math.random() * (2000 - 1000 + 1)) + 1000,
      sourceCurrency: CREDENTIALS.user3.wallet.currency,
      targetCurrency: CREDENTIALS.user1.wallet.currency,
      saveBeneficiary: false,
      token: CREDENTIALS.user3.token,
      createOtp: createOtp,
    },
  ];
};

const startUp = async (createOtp: boolean) => {
  await delay(10000)
  const user1TokenResponse = await getLoginToken(
    CREDENTIALS.user1.email,
    CREDENTIALS.user1.password
  );
  if (user1TokenResponse) {
    updateCredentialProperty(
      CREDENTIALS.user1.email,
      "token",
      user1TokenResponse.accessToken
    );
  }
  const user2TokenResponse = await getLoginToken(
    CREDENTIALS.user2.email,
    CREDENTIALS.user2.password
  );
  if (user2TokenResponse) {
    updateCredentialProperty(
      CREDENTIALS.user2.email,
      "token",
      user2TokenResponse.accessToken
    );
  }
  const user3TokenResponse = await getLoginToken(
    CREDENTIALS.user3.email,
    CREDENTIALS.user3.password
  );
  if (user3TokenResponse) {
    updateCredentialProperty(
      CREDENTIALS.user3.email,
      "token",
      user3TokenResponse.accessToken
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

const getItemByProperty = (walletAccountNo: string) => {
  const foundItem = clonedTransferPayloads.find(
    (item: any) => item.debitDetails.walletAccountNo === walletAccountNo
  );

  if (foundItem) {
    return foundItem;
  } else {
    return null;
  }
};

const transfersValid = async (transferResponses: any[]) => {
  for (let transferResponse of transferResponses) {
    if (!transferResponse.status) {
      return false;
    }
  }

  const user1TransferPayload = await getItemByProperty(
    CREDENTIALS.user1.wallet.walletAccountNo
  );
  const user2TransferPayload = await getItemByProperty(
    CREDENTIALS.user2.wallet.walletAccountNo
  );
  const user3TransferPayload = await getItemByProperty(
    CREDENTIALS.user3.wallet.walletAccountNo
  );

  const user1WalletBalance = CREDENTIALS.user1.wallet.balance;
  const user2WalletBalance = CREDENTIALS.user2.wallet.balance;
  const user3WalletBalance = CREDENTIALS.user3.wallet.balance;

  if (!user1WalletBalance || !user2WalletBalance || !user3WalletBalance) {
    return false;
  }

  if (!user1TransferPayload || !user2TransferPayload || !user3TransferPayload) {
    return false;
  }

  const user1WalletDB = await Wallet.findOne({
    walletAccountNo: CREDENTIALS.user1.wallet.walletAccountNo,
  });
  const user2WalletDB = await Wallet.findOne({
    walletAccountNo: CREDENTIALS.user2.wallet.walletAccountNo,
  });
  const user3WalletDB = await Wallet.findOne({
    walletAccountNo: CREDENTIALS.user3.wallet.walletAccountNo,
  });
  if (!user1WalletDB || !user2WalletDB || !user3WalletDB) {
    return false;
  }

  //User 1 expected balance after transfer to user2
  let user1ExpectedBalance = defaultBalance - user1TransferPayload.sourceAmount;

  user1ExpectedBalance =
    user1ExpectedBalance +
    user3TransferPayload.sourceAmount * exchangeRate(user3TransferPayload);

  //User 2 expected balance after user1 transfer
  let user2ExpectedBalance =
    defaultBalance +
    user1TransferPayload.sourceAmount * exchangeRate(user1TransferPayload);

  user2ExpectedBalance =
    user2ExpectedBalance - user2TransferPayload.sourceAmount;

  //User 3 expected balance after user2 transfer
  let user3ExpectedBalance =
    defaultBalance +
    user2TransferPayload.sourceAmount * exchangeRate(user2TransferPayload);
  user3ExpectedBalance =
    user3ExpectedBalance - user3TransferPayload.sourceAmount;

  const balances = {
    user1: [user1WalletDB.balance, user1ExpectedBalance],
    user2: [user2WalletDB.balance, user2ExpectedBalance],
    user3: [user3WalletDB.balance, user3ExpectedBalance],
  };

  logger.info(`Balances: ${JSON.stringify(balances, null, 2)}`);

  const roundTo2DP = (num: number) => Math.round(num * 100) / 100;

  if (
    roundTo2DP(user1WalletDB.balance) === roundTo2DP(user1ExpectedBalance) &&
    roundTo2DP(user2WalletDB.balance) === roundTo2DP(user2ExpectedBalance) &&
    roundTo2DP(user3WalletDB.balance) === roundTo2DP(user3ExpectedBalance)
  ) {
    return true;
  }

  return false;
};

const ensureAllTransfersFailed = async () => {
  const user1WalletBalance = CREDENTIALS.user1.wallet.balance;
  const user2WalletBalance = CREDENTIALS.user2.wallet.balance;
  const user3WalletBalance = CREDENTIALS.user3.wallet.balance;

  if (!user1WalletBalance || !user2WalletBalance || !user3WalletBalance) {
    return false;
  }

  const user1WalletDB = await Wallet.findOne({
    walletAccountNo: CREDENTIALS.user1.wallet.walletAccountNo,
  });
  const user2WalletDB = await Wallet.findOne({
    walletAccountNo: CREDENTIALS.user2.wallet.walletAccountNo,
  });
  const user3WalletDB = await Wallet.findOne({
    walletAccountNo: CREDENTIALS.user3.wallet.walletAccountNo,
  });
  if (
    user1WalletDB!.balance == defaultBalance &&
    user2WalletDB!.balance == defaultBalance &&
    user3WalletDB!.balance == defaultBalance
  ) {
    return true;
  } else {
    return false;
  }
};

describe("Load test transfer APIs", () => {
  it("users should not be able to make inter-wallet transfers without otp verification", async () => {
    process.env.TEST_ERROR = "false";
    const transferPromise = new Promise((resolve) => {
      transferEmitter.once("transferComplete", (transferResponses) => {
        resolve(transferResponses);
      });
    });
    await startUp(false);
    const response: any = await transferPromise;
    logger.info("Transfer Responses " + JSON.stringify(response, null, 2));
    const successPromise = new Promise((resolve) => {
      setTimeout(() => {
        resolve(true); // Resolve promise when event is fired
      }, 6000);
    });
    await successPromise;
    const transactionFailed = await ensureAllTransfersFailed();
    expect(true).toEqual(transactionFailed);
  });

  it("users should be able to make inter-wallet transfers with otp verification", async () => {
    // Add event listener
    process.env.TEST_ERROR = "false";
    const transferPromise = new Promise((resolve) => {
      transferEmitter.once("transferComplete", (transferResponses) => {
        resolve(transferResponses); // Resolve promise when event is fired
      });
    });
    await startUp(true);
    const response: any = await transferPromise;
    logger.info("Transfer Responses " + JSON.stringify(response, null, 2));
    const successPromise = new Promise((resolve) => {
      setTimeout(() => {
        resolve(true); // Resolve promise when event is fired
      }, 6000);
    });
    await successPromise;
    const transactionSuccess = await transfersValid(response);
    expect(true).toEqual(transactionSuccess);
  });
});
