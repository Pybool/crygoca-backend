import { Request, Response } from "express";
import {
  archiveListings,
  bookMarkingListing,
  createListingForSale,
  editListing,
  fetchCrypto,
  fetchOrFilterListingsForSale,
  getCryptos,
  getSupportedCryptos,
} from "../../services/v1/listingsServices/cryptolisting.service";
import axios from "axios";
interface Xrequest extends Request {
  body: any;
}

export const liveCryptoCurrenciesController: any = {
  fetchCrypto: async (req: Xrequest, res: Response) => {
    try {
      const url: string = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?start=1&limit=${
        req.query.limit as string
      }&convert=USD&CMC_PRO_API_KEY=${process.env.COIN_CAP_KEY}`;
      const result = await fetchCrypto(url);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  getCryptos: async (req: Xrequest, res: Response) => {
    try {
      const result = await getCryptos(req);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  cryptoConversion: async (req: Request, res: Response) => {
    const { from, to, amount } = req.query;

    if (!from || !to || !amount) {
      return res
        .status(400)
        .json({ status: false, message: "Missing required parameters" });
    }

    try {
      const coinLayerUrl = `https://api.coinlayer.com/convert?access_key=${process
        .env.COINLAYER_API_KEY!}&from=${from}&to=${to}&amount=${amount}`;

      const response = await axios.get(coinLayerUrl);

      const result = response.data;

      if (result && result.success) {
        return res.status(200).json(result);
      } else {
        return res.status(422).json({
          status: false,
          message: result?.error?.info || "Conversion failed",
          error: result,
        });
      }
    } catch (error: any) {
      return res.status(500).json({
        status: false,
        message: error?.response?.data?.error?.info || error.message,
      });
    }
  },

  getExchangePrices: async (req: Request, res: Response) => {
    const { symbol } = req.query;

    if (!symbol) {
      return res
        .status(400)
        .json({ status: false, message: "Symbol is required" });
    }

    try {
      const url = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/market-pairs/latest?symbol=${symbol}`;

      const response = await axios.get(url, {
        headers: {
          "X-CMC_PRO_API_KEY": process.env.COIN_CAP_KEY!,
          Accept: "application/json",
        },
      });

      const result = response.data;

      if (result && result.status?.error_code === 0) {
        return res.status(200).json(result);
      } else {
        return res.status(422).json({
          status: false,
          message:
            result.status?.error_message || "Failed to fetch exchange prices",
          error: result,
        });
      }
    } catch (error: any) {
      return res.status(500).json({
        status: false,
        message: error?.response?.data?.status?.error_message || error.message,
      });
    }
  },

  getSupportedCryptos: async (req: Xrequest, res: Response) => {
    try {
      const result = await getSupportedCryptos(req);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  // createListing: async (
  //   req: Xrequest,
  //   res: Response
  // ) => {
  //   try {
  //     const result = await createListingForSale(req, )
  //     if (result) {
  //       res.status(200).json(result);
  //     } else {
  //       return res.status(422).json(result);
  //     }
  //   }
  //   catch (error: any) {
  //     res.status(500).json({ status: false, message: error?.message });
  //   }
  // },

  fetchOrFilterListings: async (req: Xrequest, res: Response) => {
    try {
      const result = await fetchOrFilterListingsForSale(req);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  archiveListings: async (req: Xrequest, res: Response) => {
    try {
      const result = await archiveListings(req);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  editListing: async (req: Xrequest, res: Response) => {
    try {
      const result = await editListing(req);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },

  bookMarkingListing: async (req: Xrequest, res: Response) => {
    try {
      const result = await bookMarkingListing(req);
      if (result) {
        res.status(200).json(result);
      } else {
        return res.status(422).json(result);
      }
    } catch (error: any) {
      res.status(500).json({ status: false, message: error?.message });
    }
  },
};
