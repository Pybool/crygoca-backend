
import cron from "node-cron";
import { fork, ChildProcess } from "child_process";
import path from "path";

const startValues: any[] = [1, 5001, 10001]; // Start values
const limit = 5000;
let isCronRunning = false; // Lock mechanism to prevent overlapping

const fetchCryptoLiveUpdates = async () => {
  if (isCronRunning) {
    console.log("Skipping execution: Previous task is still running.");
    return;
  }

  console.log("Crypto task initiated...");
  isCronRunning = true;

  // Helper function to process tasks sequentially
  const processTask = (index: number): void => {
    if (index >= startValues.length) {
      console.log("All tasks completed for this cycle.");
      isCronRunning = false;
      return;
    }

    let extension = ".ts"

    if(process.env.NODE_ENV==="prod"){
      extension = '.js'
    }

    const scriptPath = path.resolve(
      __dirname,
      `./scripts/cryptoLiveUpdates${extension}`
    );
    const child: ChildProcess = fork(scriptPath, [startValues[index], limit]);

    console.log(`Processing start value: ${startValues[index]}`);

    child.on("message", (message: any) => {
      console.log(
        `Message from child process (start: ${startValues[index]}):}`
      );

      if (message.status === true) {
        console.log(
          `Task for start value ${startValues[index]} succeeded. Moving to next task.`
        );
        child.kill(); // Ensure child process is terminated
        processTask(index + 1); // Process the next start value
      } else {
        console.error(
          `Task for start value ${startValues[index]} failed. Stopping.`
        );
        child.kill(); // Terminate the child process on failure
        isCronRunning = false;
      }
    });

    child.on("exit", (code) => {
      if (code !== 0) {
        console.error(
          `Child process for start value ${startValues[index]} exited with error code: ${code}`
        );
      }
      child.kill(); // Ensure the child process is cleaned up
    });

    child.on("error", (err) => {
      console.error(
        `Error in child process for start value ${startValues[index]}:`,
        err
      );
      child.kill();
      isCronRunning = false;
    });
  };

  // Start processing tasks from the first value
  processTask(0);
};

// Schedule the task to run every hour
cron.schedule("0 * * * *", fetchCryptoLiveUpdates);

// cron.schedule('* * * * *', fetchCryptoLiveUpdates);

console.log("Cron job scheduled to run every hour.");

