import { Request, Response } from "express";
import Accounts from "../../models/accounts.model";
import Xrequest from "../../interfaces/extensions.interface";

export const addPaymentMethod = async (req: Xrequest, res: Response) => {
  try {
    const accountId = req.accountId!; // Assuming you extract user from auth middleware
    const { paymentMethod } = req.body;
    console.log(paymentMethod)
    if(!paymentMethod){
      return res
      .status(200)
      .json({ status: false, message: "Error: Invalid data supplied" });
    }

    const account = await Accounts.findOne({ _id: accountId });
    if (!account)
      return res
        .status(404)
        .json({ status: false, message: "Account not found" });

    account.paymentMethods.push(paymentMethod);
    await account.save();

    return res.json({
      status: true,
      message: "Payment method added successfully",
      account: account,
    });
  } catch (err) {
    console.log(err)
    return res
      .status(500)
      .json({ status: false, message: "Error adding payment method" });
  }
};

export const deletePaymentMethod = async (req: Xrequest, res: Response) => {
  try {
    const accountId = req.accountId!;
    const { id } = req.query;

    const account = await Accounts.findOne({ _id: accountId });
    if (!account)
      return res
        .status(404)
        .json({ status: false, message: "Account not found" });

    account.paymentMethods = account.paymentMethods.filter(
      (m: any) => m._id.toString() !== id
    );
    await account.save();

    return res.json({
      status: true,
      message: "Payment method deleted",
      account: account,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ status: false, message: "Error deleting method" });
  }
};

export const getPaymentMethods = async (req: Xrequest, res: Response) => {
  try {
    const accountId = req.accountId!;

    const account = await Accounts.findOne(
      { _id: accountId },
      "paymentMethods"
    );
    if (!account)
      return res
        .status(404)
        .json({ status: false, message: "Account not found" });

    return res.json({ status: true, data: account.paymentMethods });
  } catch (err) {
    return res
      .status(500)
      .json({ status: false, message: "Could not retrieve payment methods" });
  }
};
