import express from "express";
import { ordersController } from "../../controllers/v1/orders.controller";
import { decode } from "../../middlewares/jwt";

const ordersRouter = express.Router();
ordersRouter.get("/orders/fetch-orders", decode, ordersController._fetchOrders);
ordersRouter.get("/orders/fetch-my-orders", decode, ordersController._fetchMyOrders);
ordersRouter.put("/orders/update-status", decode, ordersController._updateStatus);
ordersRouter.put("/orders/update-buyer-claim", decode, ordersController._updateBuyerClaim);



export default ordersRouter;