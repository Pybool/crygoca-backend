import express from "express";
import { checkOutController } from "../../controllers/v1/checkout.controller";

const checkoutRouter = express.Router();
checkoutRouter.post("/checkout/save-checkout", checkOutController.saveCheckout);
checkoutRouter.post("/checkout/get-listing-changes", checkOutController.getListingChanges);

export default checkoutRouter;