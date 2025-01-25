import { paymentVerificationQueue } from "./paymentVerificationQueue";

// Function to schedule a job
export async function scheduleVerificationJob(jobData: {
  paymentReference: number;
  expectedAmount: number;
  expectedCurrency: string;
}) {
  await paymentVerificationQueue.add(
    "process-verifications", // Job name
    jobData, // Job data (if needed)
    {
      repeat: {
        every: 60 * 60 * 1000, // Repeat every 1 hour (in milliseconds)
      },
    }
  );
  console.log("Job added to queue:", jobData);
}

// // Schedule the job
// scheduleVerificationJob().catch((err) =>
//   console.error("Error scheduling job:", err)
// );
