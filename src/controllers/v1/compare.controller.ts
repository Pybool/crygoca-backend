import { Request, Response } from "express";
import {
  compareExchangeProviders,
  convertCurrency,
  getUserCountry,
} from "../../services/v1/conversions/comparison.service";
import { Icompare } from "../../interfaces/base.interface";

interface Xrequest extends Request {
  body: any;
}

export const compareController: Icompare = {
  compareExchangeProviders: async (req: Xrequest, res: Response) => {
    try {
      const compare = req.query.compare! as string;
      const { from, to, currencyFrom, currencyTo, amount } = req.body!;
      const result = await compareExchangeProviders(
        from,
        to,
        currencyFrom,
        currencyTo,
        amount,
        compare
      );
      if (result.status) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  getUserCountry: async (req: Xrequest, res: Response) => {
    try {
      const result = await getUserCountry(req);
      if (result) {
        res.status(200).json({ status: true, data: result });
      } else {
        return res.status(404).json({ status: false, data: result });
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  convertCurrency: async (req: Xrequest, res: Response) => {
    try {
      const { from, to, currencyFrom, currencyTo, amount } = req.body!;
      const result = await convertCurrency(
        from,
        to,
        currencyFrom,
        currencyTo,
        amount
      );
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(404).json({ status: false, data: result });
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },
};
