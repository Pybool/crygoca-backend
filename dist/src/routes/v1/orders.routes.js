"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const orders_controller_1 = require("../../controllers/v1/orders.controller");
const jwt_1 = require("../../middlewares/jwt");
const ordersRouter = express_1.default.Router();
ordersRouter.get("/orders/fetch-orders", jwt_1.decode, orders_controller_1.ordersController._fetchOrders);
ordersRouter.get("/orders/fetch-my-orders", jwt_1.decode, orders_controller_1.ordersController._fetchMyOrders);
ordersRouter.put("/orders/update-status", jwt_1.decode, orders_controller_1.ordersController._updateStatus);
ordersRouter.put("/orders/update-buyer-claim", jwt_1.decode, orders_controller_1.ordersController._updateBuyerClaim);
exports.default = ordersRouter;
