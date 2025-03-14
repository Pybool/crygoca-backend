import express from "express";
import { decode, decodeExt } from "../../middlewares/jwt";
import {
  createWallet,
  getReceipientWallet,
  getReceipientWalletUid,
  processWalletTransfer,
  processWalletToBankWithdrawals,
  sendTransferOtp,
  verifyTransferOtp,
  sendWithdrawalOtp,
  verifyWithdrawalOtp,
  walletGetBeneficiaries,
  cardTopUpFundWallet,
  sendWalletPaymentAuthorizationPin,
  sendExternalWalletPaymentAuthorizationPin,
  payWithWalletBalance,
  externalPaymentProcessing,
  makeExternalPayment
} from "../../controllers/v1/wallet.controller";
import { fetchTransactions } from "../../controllers/v1/waalet.transaction.controller";
import { validateSecretKey } from "../../middlewares/validateSecretKey";
import { validatePublicKey } from "../../middlewares/validatePublicKey";

const walletRouter = express.Router();
walletRouter.get("/get-wallet-balance", decode, processWalletTransfer);

walletRouter.post("/transfer-to-wallet", decode, processWalletTransfer);

walletRouter.post("/create-withdrawal-request", decode, processWalletToBankWithdrawals)

walletRouter.post("/create-wallet", decode, createWallet);

walletRouter.get("/fetch-transactions", decode, fetchTransactions);

walletRouter.get("/get-receipient-wallet-details", decodeExt, getReceipientWallet);

walletRouter.get("/get-receipient-wallet-details-uid", decode, getReceipientWalletUid);

walletRouter.post("/send-transfer-otp", decode, sendTransferOtp);

walletRouter.post("/verify-transfer-otp", decode, verifyTransferOtp);

walletRouter.post("/send-withdrawal-otp", decode, sendWithdrawalOtp);


walletRouter.post("/send-external-wallet-pay-authorization-pin", validatePublicKey, sendExternalWalletPaymentAuthorizationPin)

walletRouter.post("/send-wallet-pay-authorization-pin", decodeExt, sendWalletPaymentAuthorizationPin)

walletRouter.post("/verify-withdrawal-otp", decode, verifyWithdrawalOtp);

walletRouter.get("/fetch-beneficiaries", decode, walletGetBeneficiaries);

walletRouter.post("/card-topup-fund-wallet", decode, cardTopUpFundWallet);

walletRouter.post("/pay-with-wallet-balance", decode, payWithWalletBalance);

walletRouter.post("/create-payment", validateSecretKey, externalPaymentProcessing);

walletRouter.post("/send-payment-to-crygoca", makeExternalPayment);











// notifications/fetch-notifications



// walletRouter.post("/dev-payout-topup", decode, async (req:any, res:any) => {
//   const data = {
//     walletAccountNo: "CW-3983059457",
//     payoutConversionMetrics: {
//       from: "GH",
//       to: "ZA",
//       currencyFrom: "GHS",
//       currencyTo: "ZAR",
//       payoutAmount: 39.190200000000004,
//     },
//     operationType: "credit",
//     payoutId: new mongoose.Types.ObjectId("677ee6d84ae123017fd53eba"),
//     verifiedTransactionId: new mongoose.Types.ObjectId(
//       "677eddc96ed2b24052f58bfd"
//     ),
//   };
//   await WalletService.walletPayoutTopUp(
//     "payout-topup",
//     50.461201149978784,
//     data
//   );
//   res.status(200).json({
//     status: true
//   })
// });

export default walletRouter;
