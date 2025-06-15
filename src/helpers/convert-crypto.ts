import axios from "axios";

interface ConversionResult {
  from: string;
  to: string;
  originalAmount: number | string;
  rate: string;
  convertedAmount: number | string;
  readable: string;
  timestamp: string;
}

export async function convertCryptoToCrypto(
  from: string,
  to: string,
  amount: number | string
): Promise<ConversionResult | null> {
  const apiKey = process.env.COINLAYER_API_KEY!;
  const url = `https://api.coinlayer.com/convert?access_key=${apiKey}&from=${from}&to=${to}&amount=${amount}`;

  const response = await axios.get(url);
  const data = response.data;

  if (!data.success) {
   console.log("Conversion failed. Check API key, parameters, or quota.");
   return null;
  }

  const original = Number(data.query.amount);
  const rate = Number(data.info.rate);
  const result = Number(data.result);

  const precision = 18; // Enough to prevent exponentials
  const originalFixed = original.toFixed(precision).replace(/\.?0+$/, "");
  const resultFixed = result.toFixed(6); // 6 decimal places for final value
  const rateFixed = rate.toFixed(6);

  return {
    from,
    to,
    originalAmount: originalFixed,
    rate: rateFixed,
    convertedAmount: resultFixed,
    readable: `${originalFixed} ${from} ≈ ${resultFixed} ${to}`,
    timestamp: new Date(data.info.timestamp * 1000).toISOString(),
  };
}
