"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jwt_1 = require("../../middlewares/jwt");
const payouts_controller_1 = require("../../controllers/v1/payouts.controller");
const payoutRouter = express_1.default.Router();
payoutRouter.get("/payouts/fetch-payouts", jwt_1.decode, payouts_controller_1.payoutController._getPayouts);
exports.default = payoutRouter;
