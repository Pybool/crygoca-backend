import express from "express";
import { ordersController } from "../../controllers/v1/orders.controller";
import { decode } from "../../middlewares/jwt";
import { EscrowController } from "../../controllers/v1/escrow-controller";
import { getMulterConfigSingle } from "../../middlewares/fileUploads.middleware";

const ordersRouter = express.Router();
ordersRouter.get("/orders/fetch-orders", decode, ordersController._fetchOrders);
ordersRouter.get(
  "/orders/fetch-my-orders",
  decode,
  ordersController._fetchMyOrders
);
ordersRouter.put(
  "/orders/update-status",
  decode,
  ordersController._updateStatus
);
ordersRouter.put(
  "/orders/update-buyer-claim",
  decode,
  ordersController._updateBuyerClaim
);

ordersRouter.post(
  "/create-deposit-intent",
  decode,
  EscrowController.createDepositIntent
);
ordersRouter.post(
  "/orders/reserve-order",
  decode,
  EscrowController.lockFundsForOrder
);
ordersRouter.post("/release/:orderId", EscrowController.releaseFunds);
ordersRouter.post("/orders/cancel/:orderId", EscrowController.cancelOrder);
ordersRouter.post(
  "/orders/cancel-deposit/:orderId",
  EscrowController.cancelDeposit
);
ordersRouter.get("/order/:orderId", EscrowController.getOrder);
ordersRouter.get("/balance/:userId", EscrowController.getUserBalance);
ordersRouter.post(
  "/orders/manually-confirm-deposit-payment",
  decode,
  EscrowController.manuallyConfirmDeposit
);
ordersRouter.get(
  "/fetch-deposit-intents",
  EscrowController.fetchDepositIntents
);
ordersRouter.post(
  "/orders/submit-complaint",
  decode,
  getMulterConfigSingle("../public/orders/complaints/"),
  ordersController._submitComplaint
);

export default ordersRouter;
