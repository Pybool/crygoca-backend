import express from "express";
import { liveCryptoCurrenciesController } from "../../controllers/v1/liveCrypto.controller";
import { decode } from "../../middlewares/jwt";
import Cryptocurrencies from "../../models/cryptocurrencies.model";
import { convertCryptoToCrypto } from "../../helpers/convert-crypto";

const liveCrypto = express.Router();
liveCrypto.get(
  "/fetch-live-cryptocurrencies",
  liveCryptoCurrenciesController.fetchCrypto
);

// liveCrypto.get("/get-cryptos", liveCryptoCurrenciesController.getCryptos);
liveCrypto.get("/get-cryptos", liveCryptoCurrenciesController.getSupportedCryptos);


liveCrypto.get(
  "/crypto-conversion",
  liveCryptoCurrenciesController.cryptoConversion
);

liveCrypto.get('/exchange-prices', liveCryptoCurrenciesController.exchangePrices);

liveCrypto.put(
  "/edit-crypto-sales-listing",
  decode,
  liveCryptoCurrenciesController.editListing
);

liveCrypto.post(
  "/bookmarking-crypto-sales-listing",
  decode,
  liveCryptoCurrenciesController.bookMarkingListing
);





liveCrypto.get(
  "/fetch-crypto-sales-listings",
  decode,
  liveCryptoCurrenciesController.fetchOrFilterListings
);

liveCrypto.post(
  "/archive-crypto-sales-listing",
  decode,
  liveCryptoCurrenciesController.archiveListings
)

liveCrypto.get("/convert-crypto-to-crypto", async (req: any, res: any) => {
  const { from, to, amount } = req.query;

  if (!from || !to || !amount) {
    return res.status(400).json({ error: "Missing 'from', 'to', or 'amount' in query params." });
  }

  try {
    const result = await convertCryptoToCrypto(from, to, amount);
    return res.json({ success: true, conversion: result });
  } catch (err: any) {
    console.error("Conversion error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
});


liveCrypto.post("/update-crypto-quotes", async (req: any, res: any) => {
  const cryptocurrenciesData = req.body.data;
  for (let cryptocurrency of cryptocurrenciesData) {
    const crypto = await Cryptocurrencies.findOne({
      name: cryptocurrency.name,
      symbol: cryptocurrency.symbol,
    });
    if (crypto) {
      crypto.quote = cryptocurrency.quote;
      await crypto.save();
    }
  }
  return res.send({ success: "ok" });
});

export default liveCrypto;
