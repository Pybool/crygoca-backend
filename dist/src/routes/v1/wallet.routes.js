"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jwt_1 = require("../../middlewares/jwt");
const wallet_controller_1 = require("../../controllers/v1/wallet.controller");
const waalet_transaction_controller_1 = require("../../controllers/v1/waalet.transaction.controller");
const validateSecretKey_1 = require("../../middlewares/validateSecretKey");
const validatePublicKey_1 = require("../../middlewares/validatePublicKey");
const walletRouter = express_1.default.Router();
walletRouter.get("/get-wallet-balance", jwt_1.decode, wallet_controller_1.processWalletTransfer);
walletRouter.post("/transfer-to-wallet", jwt_1.decode, wallet_controller_1.processWalletTransfer);
walletRouter.post("/create-withdrawal-request", jwt_1.decode, wallet_controller_1.processWalletToBankWithdrawals);
walletRouter.post("/create-wallet", jwt_1.decode, wallet_controller_1.createWallet);
walletRouter.get("/fetch-transactions", jwt_1.decode, waalet_transaction_controller_1.fetchTransactions);
walletRouter.get("/get-receipient-wallet-details", jwt_1.decodeExt, wallet_controller_1.getReceipientWallet);
walletRouter.get("/get-receipient-wallet-details-uid", jwt_1.decode, wallet_controller_1.getReceipientWalletUid);
walletRouter.post("/send-transfer-otp", jwt_1.decode, wallet_controller_1.sendTransferOtp);
walletRouter.post("/verify-transfer-otp", jwt_1.decode, wallet_controller_1.verifyTransferOtp);
walletRouter.post("/send-withdrawal-otp", jwt_1.decode, wallet_controller_1.sendWithdrawalOtp);
walletRouter.post("/send-external-wallet-pay-authorization-pin", validatePublicKey_1.validatePublicKey, wallet_controller_1.sendExternalWalletPaymentAuthorizationPin);
walletRouter.post("/send-wallet-pay-authorization-pin", jwt_1.decodeExt, wallet_controller_1.sendWalletPaymentAuthorizationPin);
walletRouter.post("/verify-withdrawal-otp", jwt_1.decode, wallet_controller_1.verifyWithdrawalOtp);
walletRouter.get("/fetch-beneficiaries", jwt_1.decode, wallet_controller_1.walletGetBeneficiaries);
walletRouter.post("/card-topup-fund-wallet", jwt_1.decode, wallet_controller_1.cardTopUpFundWallet);
walletRouter.post("/pay-with-wallet-balance", jwt_1.decode, wallet_controller_1.payWithWalletBalance);
walletRouter.post("/create-payment", validateSecretKey_1.validateSecretKey, wallet_controller_1.externalPaymentProcessing);
walletRouter.post("/send-payment-to-crygoca", wallet_controller_1.makeExternalPayment);
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
exports.default = walletRouter;
