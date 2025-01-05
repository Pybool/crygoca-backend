// import cron from 'node-cron';
// import { fetchRates } from "./liveCurrencies.service";

// const fetchRatesTask = async () => {
//     console.log("Task running")
//     await fetchRates("https://ng.investing.com/currencies/streaming-forex-rates-majors", true)
//     // await fetchRates("https://finance.yahoo.com/currencies", true)
// };
// // Schedule the feed generator to run every minute
// cron.schedule('* * * * *', fetchRatesTask);


import cron from 'node-cron';
import { fork } from 'child_process';  // Import fork from child_process module
import path from 'path';  // Path module to resolve the file location

// Define the task that fetches rates
const fetchRatesTask = async () => {
    console.log("Task running");
    let extension = ".ts"

    if(process.env.NODE_ENV==="prod"){
      extension = '.js'
    }

    // The path to your liveCurrencies.service.js file (or where your fetchRates method is defined)
    const scriptPath = path.resolve(__dirname, `./scripts/livecurrencies${extension}`);  // Adjust this path accordingly
    // console.log("scriptPath ", scriptPath)
    // Fork a child process to run the task independently
    const child = fork(scriptPath, ['https://ng.investing.com/currencies/streaming-forex-rates-majors', 'true']);

    child.on('message', (message) => {
        console.log('Message from child process:', message);
    });

    child.on('exit', (code) => {
        console.log(`Child process exited with code ${code}`);
    });
};

// Schedule the task to run every minute using cron
cron.schedule('* * * * *', fetchRatesTask);
// cron.schedule("0 * * * *", fetchRatesTask);
