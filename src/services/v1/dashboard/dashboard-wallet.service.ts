import Xrequest from "../../../interfaces/extensions.interface";
import { WalletTransaction } from "../../../models/wallet-transaction.model";

export class DashboardWalletService {
  public static async fetchWalletTransactionData(
    accountId: string,
    operationType:string,
    timePeriod: string
  ) {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    if (timePeriod === "daily") {
      // Find Monday of the current week
      const currentWeekDay = now.getDay(); // 0 (Sun) to 6 (Sat)
      const mondayOffset = currentWeekDay === 0 ? -6 : 1 - currentWeekDay; // Adjust if today is Sunday
      startDate = new Date(now);
      startDate.setDate(now.getDate() + mondayOffset);
      startDate.setHours(0, 0, 0, 0);

      // Set end date to Sunday
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (timePeriod === "weekly") {
      // Get start and end of the current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1); // First day of the month
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of the month
      endDate.setHours(23, 59, 59, 999); // End of the last day
    } else if (timePeriod === "monthly") {
      // Get start and end of the year
      startDate = new Date(now.getFullYear(), 0, 1); // January 1st
      endDate = new Date(now.getFullYear(), 11, 31); // December 31st
      endDate.setHours(23, 59, 59, 999);
    } else {
      throw new Error("Invalid time period specified");
    }

    // Fetch data from the database within the date range
    const transactions = await this.getTransactionsBetweenDates(
      accountId,
      operationType,
      startDate,
      endDate
    );
    // Process the data for visualization
    return this.groupTransactionsByPeriod(transactions, timePeriod);
  }

  // Helper to fetch transactions from the database
  public static async getTransactionsBetweenDates(
    accountId: string,
    operationType:string,
    startDate: Date,
    endDate: Date
  ) {
    return WalletTransaction.find({
      user: accountId,
      operationType:operationType,
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .select("amount createdAt")
      .lean(); // Only fetch necessary fields
  }

  // Helper to group transactions based on the time period
  public static async groupTransactionsByPeriod(
    transactions: any[],
    timePeriod: string
  ) {
    const groupedData: { [key: string]: number } = {};

    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      const date = new Date(transaction.createdAt);
      let key: string = "";

      if (timePeriod === "daily") {
        key = date.toLocaleDateString("en-US", { weekday: "long" }); // Group by day of the week (e.g., Monday)
      } else if (timePeriod === "weekly") {
        const week = Math.ceil(date.getDate() / 7); // Group by week number (1-4)
        key = `Week ${week}`;
      } else if (timePeriod === "monthly") {
        key = date.toLocaleString("default", { month: "long" }); // Group by month (e.g., January)
      }

      if (!groupedData[key]) {
        groupedData[key] = 0;
      }
      groupedData[key] += transaction.amount; // Sum the amounts
    }

    return groupedData;
  }
}
