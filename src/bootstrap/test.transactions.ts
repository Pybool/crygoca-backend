import mongoose from 'mongoose';
import Accounts from '../models/accounts.model';
import { Wallet } from '../models/wallet.model';

mongoose.connect(
  'mongodb+srv://10111011qweQWE:10111011qweQWE@all4one.fgxnfw3.mongodb.net/?retryWrites=true&w=majority&appName=All4One',
  {
    dbName: 'CRYGOCA-UAT',
    useNewUrlParser: true,
    useUnifiedTopology: true,
    socketTimeoutMS: 240000, // Set timeout to 4 minutes (240,000 milliseconds)
    serverSelectionTimeoutMS: 240000,
  } as mongoose.ConnectOptions
)
  .then(() => console.log('MongoDB Transaction Connected'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

export async function runTransaction() {
  const session = await mongoose.startSession();
  session.startTransaction(); // Start the transaction

  try {
    // ✅ Pass session in the query options (not inside projection)
    const user = await Accounts.findOne({ username: 'Eko@1011' }).session(session);

    if (!user) {
      throw new Error('User not found');
    }

    user.surname = 'Eko';
    await user.save({ session }); // ✅ Save inside the transaction session

    // ✅ Also pass session correctly in findOneAndUpdate
    const order = await Wallet.findOneAndUpdate(
      { user: user._id },
      { balance: 40000 },
      { session, new: true } // ✅ Correct session placement
    );

    if (order) {
      throw new Error('Wallet not found');
    }

    await session.commitTransaction(); // Commit if successful
    console.log('Transaction committed successfully!');
  } catch (error) {
    await session.abortTransaction(); // Rollback on failure
    console.error('Transaction aborted due to error:', error);
  } finally {
    session.endSession();
  }
}


const x = {
  "externalCustomerId": "test_external_customer_id",
  "id": "ad75172f-f9f8-4835-ac26-b08c189923b3",
  "createdAt": "2025-01-31T12:05:50.850Z",
  "updatedAt": "2025-01-31T12:05:51.509Z",
  "baseCurrencyAmount": 1286,
  "feeAmount": 12.2,
  "extraFeeAmount": 0,
  "quoteCurrencyAmount": 1208.17,
  "flow": "floating",
  "status": "waitingForDeposit",
  "accountId": "ad75172f-f9f8-4835-ac26-b08c189923b3",
  "customerId": "ad75172f-f9f8-4835-ac26-b08c189923b3",
  "quoteCurrencyId": "71435a8d-211c-4664-a59e-2a5361a6c5a7",
  "baseCurrencyId": "acb9589d-c7cf-41a8-b220-875f2867bd46",
  "eurRate": 1,
  "usdRate": 1.03748,
  "gbpRate": 0.83603,
  "depositWalletId": "ad75172f-f9f8-4835-ac26-b08c189923b3",
  "cryptoWalletId": null,
  "bankAccountId": "ad75172f-f9f8-4835-ac26-b08c189923b3",
  "cardId": null,
  "refundWalletAddress": "H1cUTsMALg9AS3A2NTeS18sf14EfkYcJM2HY4LB2TUFR",
  "refundWalletAddressRequestedAt": null,
  "externalTransactionId": null,
  "failureReason": null,
  "depositHash": null,
  "refundHash": null,
  "widgetRedirectUrl": "test_redirect_url",
  "confirmations": null,
  "quoteExpiresAt": null,
  "quoteExpiredEmailSentAt": null,
  "refundApprovalStatus": null,
  "cancelledById": null,
  "blockedById": null,
  "depositMatchedManuallyById": null,
  "createdById": null,
  "incomingCustomerCryptoDepositId": null,
  "payoutMethod": "sepa_bank_transfer",
  "integratedSellDepositInfo": null,
  "baseCurrency": {
      "notAllowedUSStates": [
          "VI"
      ],
      "notAllowedCountries": [
          "CA"
      ],
      "id": "acb9589d-c7cf-41a8-b220-875f2867bd46",
      "createdAt": "2022-01-04T17:08:50.653Z",
      "updatedAt": "2025-01-31T12:00:00.171Z",
      "type": "crypto",
      "name": "USD Coin (Solana)",
      "code": "usdc_sol",
      "precision": 2,
      "decimals": 6,
      "icon": "https://static.moonpay.com/widget/currencies/usdc.svg",
      "maxAmount": null,
      "minAmount": null,
      "minBuyAmount": 5,
      "maxBuyAmount": 30000,
      "isSellSupported": true,
      "isUtxoCompatible": false,
      "addressRegex": "^[1-9A-HJ-NP-Za-km-z]{32,44}$",
      "testnetAddressRegex": "^[1-9A-HJ-NP-Za-km-z]{32,44}$",
      "supportsAddressTag": false,
      "addressTagRegex": null,
      "supportsTestMode": false,
      "supportsLiveMode": true,
      "isSuspended": false,
      "isStableCoin": true,
      "confirmationsRequired": 1,
      "minSellAmount": 18.61077,
      "maxSellAmount": 10000,
      "isSwapBaseSupported": true,
      "isSwapQuoteSupported": true,
      "isBaseAsset": false,
      "isSupportedInUS": true,
      "metadata": {
          "contractAddress": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          "coinType": "501",
          "chainId": null,
          "networkCode": "solana"
      }
  },
  "depositWallet": {
      "id": "ad75172f-f9f8-4835-ac26-b08c189923b3",
      "createdAt": "2025-01-28T08:24:26.843Z",
      "updatedAt": "2025-01-28T08:24:26.843Z",
      "walletAddress": "7WaARgaexPU4kip29P5gQapfTaC3z7qev9o3d7TZTd5J",
      "walletAddressTag": "",
      "customerId": "ad75172f-f9f8-4835-ac26-b08c189923b3",
      "currencyId": "acb9589d-c7cf-41a8-b220-875f2867bd46",
      "btcLegacyAddress": null
  },
  "quoteCurrency": {
      "id": "71435a8d-211c-4664-a59e-2a5361a6c5a7",
      "createdAt": "2019-04-22T15:12:07.861Z",
      "updatedAt": "2024-11-25T09:38:26.523Z",
      "type": "fiat",
      "name": "Euro",
      "code": "eur",
      "precision": 2,
      "decimals": null,
      "icon": "https://static.moonpay.com/widget/currencies/eur.svg",
      "maxAmount": 10000,
      "minAmount": 30,
      "minBuyAmount": 20,
      "maxBuyAmount": 30000,
      "isSellSupported": true,
      "isUtxoCompatible": false
  },
  "country": "GRC",
  "state": null
}