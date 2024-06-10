import cron from 'node-cron';
import { fetchRates } from "./liveCurrencies.service";

const fetchRatesTask = async () => {
    console.log("Task running")
    await fetchRates("https://ng.investing.com/currencies/streaming-forex-rates-majors", true)
    // await fetchRates("https://finance.yahoo.com/currencies", true)
};
// Schedule the feed generator to run every minute
cron.schedule('* * * * *', fetchRatesTask);