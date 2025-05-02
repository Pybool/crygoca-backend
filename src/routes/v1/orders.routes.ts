import express from "express";
import { ordersController } from "../../controllers/v1/orders.controller";
import { decode } from "../../middlewares/jwt";
import { EscrowController } from "../../controllers/v1/escrow-controller";

const ordersRouter = express.Router();
ordersRouter.get("/orders/fetch-orders", decode, ordersController._fetchOrders);
ordersRouter.get("/orders/fetch-my-orders", decode, ordersController._fetchMyOrders);
ordersRouter.put("/orders/update-status", decode, ordersController._updateStatus);
ordersRouter.put("/orders/update-buyer-claim", decode, ordersController._updateBuyerClaim);

ordersRouter.post("/create-deposit-intent", decode, EscrowController.createDepositIntent);
ordersRouter.post("/orders/reserve-order", decode, EscrowController.lockFundsForOrder);
ordersRouter.post("/release/:orderId", EscrowController.releaseFunds);
ordersRouter.post("/cancel/:orderId", EscrowController.cancelOrder);
ordersRouter.get("/order/:orderId", EscrowController.getOrder);
ordersRouter.get("/balance/:userId", EscrowController.getUserBalance);

export default ordersRouter;