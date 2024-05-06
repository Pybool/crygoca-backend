const axios = require("axios");
import { getCountryNameByCode } from "../../helpers/countries";
import { getCountryCurrencyByCountryCode } from "../../helpers/currenciesCountryCodes";
// https://api.transferwise.com/v3/comparisons/?sendAmount=1000&sourceCurrency=CAD&targetCurrency=USD
import "./liveCurrencies.service";
import geoip from "geoip-lite"; // Import geoip-lite library

interface Quote {
  rate: number;
  fee: number;
  receivedAmount: number;
}

interface Provider {
  quotes: Quote[];
}

export async function getUserCountry(req: any): Promise<any> {
  try {
    let geoData = geoip.lookup(req.ip) as any;
    const countryCode = geoData.country;
    geoData.country = getCountryNameByCode(countryCode);
    geoData.currency = getCountryCurrencyByCountryCode(countryCode);
    geoData.countryCode = countryCode;
    if (geoData) {
      return {
        geoData,
        connectionRemoteAddress: req.connection.remoteAddress,
        reqIp: req.ip,
        socketRemoteAddress: req.socket.remoteAddress,
        forwardedIp: req.headers["x-forwarded-for"]
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching geolocation data:", error);
    return null; // Return null in case of errors
  }
}

export async function compareExchangeProviders(
  from: string,
  to: string,
  currencyFrom: string,
  currencyTo: string,
  amount: string,
  compare: string
) {
  const data = {
    lang: "en",
    from: from.toUpperCase(),
    to: to.toUpperCase(),
    currencyFrom: currencyFrom.toUpperCase(),
    currencyTo: currencyTo.toUpperCase(),
    amount: parseInt(amount),
    maxAge: 0,
  };

  try {
    const response = await axios.get(
      `https://api.transferwise.com/v3/comparisons/?sendAmount=${data.amount}&sourceCurrency=${data.currencyFrom}&targetCurrency=${data.currencyTo}`
    );

    const filter: any[] = [];
    let responseData: any = response.data;
    if (compare === "1") {
      responseData = response.data;
    } else {
      responseData = calculateAverageQuotes(responseData.providers);
    }
    return { status: true, filter, data: responseData };
  } catch (error: any) {
    return { status: false, error: error.message };
  }
}

function calculateAverageQuotes(providers: Provider[]): any {
  let totalRate = 0;
  let totalReceivedAmount = 0;
  let totalQuotes = 0;

  providers.forEach((provider) => {
    provider.quotes.forEach((quote) => {
      totalRate += quote.rate;
      totalReceivedAmount += quote.receivedAmount;
      totalQuotes++;
    });
  });

  const averageRate = totalRate / totalQuotes;
  const averageReceivedAmount = totalReceivedAmount / totalQuotes;

  // You can return averageRate or averageReceivedAmount, depending on your requirement
  return { averageRate, averageReceivedAmount };
}


