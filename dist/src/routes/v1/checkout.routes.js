"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const checkout_controller_1 = require("../../controllers/v1/checkout.controller");
const checkoutRouter = express_1.default.Router();
checkoutRouter.post("/checkout/save-checkout", checkout_controller_1.checkOutController.saveCheckout);
checkoutRouter.post("/checkout/get-listing-changes", checkout_controller_1.checkOutController.getListingChanges);
exports.default = checkoutRouter;
