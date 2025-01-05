import cron from "node-cron";
import { fork } from "child_process"; // Import fork from child_process module
import path from "path"; // Path module to resolve the file location
import { FailedVerificationQueue } from "../payments/flutterwave.service";

// Define the task that fetches rates
const retryVerification = async () => {
  console.log("Task running");
  let extension = ".ts"

    if(process.env.NODE_ENV==="prod"){
      extension = '.js'
    }

  // The path to your liveCurrencies.service.js file (or where your fetchRates method is defined)
  const scriptPath = path.resolve(__dirname, `./scripts/verifycardpayment${extension}`); // Adjust this path accordingly
  // Fork a child process to run the task independently

  const child = fork(scriptPath, []);

  child.on("message", (message) => {
    console.log("Message from child process:", message);
  });

  child.on("exit", (code) => {
    console.log(`Verification retry Child process exited with code ${code}`);
  });
};

// Schedule the task to run every minute using cron
cron.schedule("* * * * *", retryVerification);


/* DO NOT FORGET TO QUEUE CHECKOUTIDS CRYPTOLISTINGPURCHASE WHOSE PAYMENT ARE NOT CONFIRMED AND ARE NOT IN QUEUE. */
