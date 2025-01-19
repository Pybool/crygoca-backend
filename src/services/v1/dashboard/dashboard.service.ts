import mongoose from "mongoose";
import Xrequest from "../../../interfaces/extensions.interface";
import CryptoListingPurchase from "../../../models/listingPurchase.model";
import Payout from "../../../models/payouts.model";
import Accounts from "../../../models/accounts.model";
import ReferralReward from "../../../models/referralrewards.model";
import VerifiedTransactions from "../../../models/verifiedtransactions.model";
import { getCountryCodeByCurrencyCode } from "../../../models/countries";
import { convertCurrency } from "../conversions/comparison.service";

interface Data {
  resultForward?: number;
  resultBackward?: number;
  percentageChange?: number;
  activeCurrency?: string;
}

function calculatePercentageChange(data: Data): number {
  // Set missing keys to 0 if they are not present
  const forward = data.resultForward ?? 0;
  const backward = data.resultBackward ?? 0;

  // Avoid division by zero if backward is zero
  if (backward === 0) {
    return 0; // Return 0 if division by zero occurs
  }

  // Calculate the percentage change
  const percentageChange = ((forward - backward) / backward) * 100;
  return percentageChange;
}

export class DashboardService {
  public static async getImmediatelyVisibleData(req: Xrequest) {
    try {
      const totalSales = await DashboardService.getTotalSalesData(req);
      const totalEarnings = await DashboardService.getTotalEarningsData(req);
      const totalPurchaseSpend = await DashboardService.getPurchaseSpendData(
        req
      );
      const totalDisputesCount = await DashboardService.getPendingDisputesCount(
        req
      );
      const totalPendingOrdersCount =
        await DashboardService.getPendingOrdersData(req);
      const referralsData = await DashboardService.getReferralsData(req);
      const popularCryptoData = await DashboardService.getPopularsData();
      const recentTransactions = await DashboardService.getRecentTransactions(
        req
      );
      const accountDateFilter = DashboardService.getAccountDateFilter(req);
      return {
        status: true,
        data: {
          totalSales,
          totalEarnings,
          totalDisputesCount,
          totalPendingOrdersCount,
          totalPurchaseSpend,
          referralsData,
          popularCryptoData,
          recentTransactions: recentTransactions,
          accountDateFilter,
        },
      };
    } catch (error: any) {
      console.log(error);
    }
  }

  public static async fetchSalesTimelineData(req: Xrequest) {
    /* Immediately visible are the top 3 cards, referral data and graph */
    try {
      const totalSales = await DashboardService.getTotalSalesData(req);
      const accountDateFilter = DashboardService.getAccountDateFilter(req);
      return {
        status: true,
        data: {
          totalSales,
          accountDateFilter,
        },
      };
    } catch (error: any) {
      console.log(error);
    }
  }

  public static async fetchEarningsTimelineData(req: Xrequest) {
    /* Immediately visible are the top 3 cards, referral data and graph */
    try {
      const totalEarnings = await DashboardService.getTotalEarningsData(req);
      const accountDateFilter = DashboardService.getAccountDateFilter(req);
      return {
        status: true,
        data: {
          totalEarnings,
          accountDateFilter,
        },
      };
    } catch (error: any) {
      console.log(error);
    }
  }

  public static async fetchPurchaseSpendTimelineData(req: Xrequest) {
    try {
      const totalPurchaseSpend = await DashboardService.getPurchaseSpendData(
        req
      );
      const accountDateFilter = DashboardService.getAccountDateFilter(req);
      return {
        status: true,
        data: {
          totalPurchaseSpend,
          accountDateFilter,
        },
      };
    } catch (error: any) {
      console.log(error);
    }
  }

  public static async getCenterVisibleData(req: Xrequest) {
    /* Immediately visible are the 3 popular cards, sell order and buy order */
    try {
    } catch (error: any) {}
  }

  private static getAccountDateFilter(req: Xrequest) {
    const accountId: string =
      (req.accountId as string) || (req.query.accountId as string);
    const timePeriod: string = (req.query.timePeriod as string) || "all";

    const now = new Date();
    let currentStartDate: Date | null = null;
    let currentEndDate: Date | null = now;
    let backwardStartDate: Date | null = null;
    let backwardEndDate: Date | null = null;

    if (timePeriod === "today") {
      // Current: Start and end of today
      currentStartDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
      );
      backwardStartDate = new Date(currentStartDate);
      backwardStartDate.setDate(currentStartDate.getDate() - 1); // Yesterday
      backwardEndDate = new Date(currentStartDate);
    } else if (timePeriod === "thisWeek") {
      // Current: Start and end of the current week
      const currentWeekDay = now.getDay(); // 0 (Sun) to 6 (Sat)
      currentStartDate = new Date(now);
      currentStartDate.setDate(now.getDate() - currentWeekDay);
      currentStartDate.setHours(0, 0, 0, 0);
      backwardStartDate = new Date(currentStartDate);
      backwardStartDate.setDate(currentStartDate.getDate() - 7); // Start of last week
      backwardEndDate = new Date(backwardStartDate);
      backwardEndDate.setDate(backwardStartDate.getDate() + 6); // End of last week
    } else if (timePeriod === "thisMonth") {
      // Current: Start and end of the current month
      currentStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
      backwardStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      backwardEndDate = new Date(now.getFullYear(), now.getMonth(), 0); // Last day of the previous month
    }

    const dateFilter: any = {
      forward:
        currentStartDate && currentEndDate
          ? { $gte: currentStartDate, $lte: currentEndDate }
          : {},
      backward:
        backwardStartDate && backwardEndDate
          ? { $gte: backwardStartDate, $lte: backwardEndDate }
          : {},
    };
    let period = "All Time";
    if (timePeriod === "today") {
      period = "Today";
    } else if (timePeriod === "thisWeek") {
      period = "Since 7 Days";
    } else if (timePeriod === "thisMonth") {
      period = "Since 30 Days";
    }

    return {
      accountId,
      dateFilter,
      period,
    };
  }

  private static async getTotalSalesData(req: Xrequest) {
    const accountDateFilter = DashboardService.getAccountDateFilter(req);
    const accountId: string = accountDateFilter.accountId;
    const dateFilterBackWard: any = accountDateFilter.dateFilter.backward;
    const dateFilterForWard: any = accountDateFilter.dateFilter.forward;

    const commonAggregationStages: any = [
      {
        $lookup: {
          from: "cryptolistings",
          localField: "cryptoListing",
          foreignField: "_id",
          as: "cryptoListing",
        },
      },
      {
        $unwind: "$cryptoListing", // Unwind cryptoListing array
      },
      {
        $lookup: {
          from: "accounts", // The accounts collection to join with
          localField: "cryptoListing.account", // The field in the cryptoListing that links to the accounts collection
          foreignField: "_id", // Match it with the _id field in the accounts collection
          as: "cryptoListing.accountDetails", // The alias for the populated account
        },
      },
      {
        $unwind: {
          path: "$cryptoListing.accountDetails", // Unwind the accountDetails inside cryptoListing
          preserveNullAndEmptyArrays: true, // Optional: include entries even if there is no match for accountDetails
        },
      },
    ];

    const getPipeline: any = (_dateFilter: any) => {
      const pipeline: any[] = [
        ...commonAggregationStages,
        {
          $match: {
            $and: [
              {
                // Match orders for a specific accountId
                "cryptoListing.accountDetails._id": new mongoose.Types.ObjectId(
                  accountId
                ),
              },
              {
                fulfillmentStatus: "Completed",
              },
              {
                buyerFulfillmentClaim: "Closed",
              },
            ].filter(Boolean),
          },
        },
        {
          $addFields: {
            sales: {
              $multiply: ["$units", "$unitPriceAtPurchaseTime"], // Compute sales per purchase
            },
          },
        },
        {
          $facet: {
            totalSales: [
              {
                $group: {
                  _id: null, // Group all documents
                  totalSales: { $sum: "$sales" }, // Sum up the sales
                },
              },
            ],
          },
        },
        {
          $project: {
            purchases: 1,
            totalSales: { $arrayElemAt: ["$totalSales.totalSales", 0] }, // Extract totalSales value
          },
        },
      ];

      // Conditionally add the createdAt filter if the timePeriod query is present
      if (req.query.timePeriod) {
        pipeline[pipeline.length - 4].$match.$and.push({
          createdAt: _dateFilter, // Apply the date filter dynamically
        });
      }

      return {
        aggregationPipeline: pipeline,
      };
    };

    const pipelineBackward =
      getPipeline(dateFilterBackWard).aggregationPipeline;
    const pipelineForward = getPipeline(dateFilterForWard).aggregationPipeline;
    const resultBackward = await CryptoListingPurchase.aggregate(
      pipelineBackward
    );
    const resultForward = await CryptoListingPurchase.aggregate(
      pipelineForward
    );

    const account = await Accounts.findOne({ _id: accountId });
    if (!account) {
      return null;
    }

    const currencyTo = account.geoData.currency?.code || 'USD';
    const currencyFrom = "USD";
    const from = getCountryCodeByCurrencyCode(currencyFrom.toUpperCase())!.code;

    const to = getCountryCodeByCurrencyCode(currencyTo.toUpperCase())!.code;
    console.log(from, to, currencyFrom, currencyTo);

    const convertToDefaultCurrency = async (amount: number) => {
      if (from && to && currencyFrom && currencyTo) {
        return await convertCurrency(
          from,
          to,
          currencyFrom,
          currencyTo,
          amount?.toString()
        );
      }
      return null;
    };

    const exchangeRateData:any = await convertToDefaultCurrency(1);

    const exchangeRate:any = exchangeRateData?.data?.data[currencyTo]?.value || 1;

    console.log("exchangeRate ===> ", exchangeRate)
    console.log("Sales ====> ", (resultForward[0] || { purchases: [], totalSales: 0 })
    .totalSales)

    const convertedResultForward =(resultForward[0] || { purchases: [], totalSales: 0 })
    .totalSales * exchangeRate!;

    const convertedResultBackward = (resultBackward[0] || { purchases: [], totalSales: 0 })
    .totalSales * exchangeRate!;

    let activeCurrency:any = null;
    
    if(!exchangeRateData!?.data!?.data[currencyTo]?.value){
      activeCurrency = currencyFrom
    }

    const results: Data = {
      resultForward: convertedResultForward,
      resultBackward: convertedResultBackward,
      activeCurrency: activeCurrency
    };
    results.percentageChange = calculatePercentageChange(results);
    return results;
  }

  private static async getTotalEarningsData(req: Xrequest) {
    const accountDateFilter = DashboardService.getAccountDateFilter(req);
    const accountId: string = accountDateFilter.accountId;
    const dateFilterBackWard: any = accountDateFilter.dateFilter.backward;
    const dateFilterForWard: any = accountDateFilter.dateFilter.forward;

    const forwardMatch: any = {
      vendorAccount: new mongoose.Types.ObjectId(accountId),
    };

    const backwardMatch: any = {
      vendorAccount: new mongoose.Types.ObjectId(accountId),
    };

    if (req.query.timePeriod) {
      forwardMatch.createdAt = dateFilterForWard;
      backwardMatch.createdAt = dateFilterBackWard;
    }

    const earningsbackwards = await Payout.aggregate([
      {
        $match: backwardMatch,
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$payout" },
        },
      },
    ]);

    const earningsForwards = await Payout.aggregate([
      {
        $match: forwardMatch,
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$payout" },
        },
      },
    ]);

    const results: Data = {
      resultForward:
        earningsForwards.length > 0 ? earningsForwards[0].totalAmount : 0,
      resultBackward:
        earningsbackwards.length > 0 ? earningsbackwards[0].totalAmount : 0,
    };
    results.percentageChange = calculatePercentageChange(results);
    return results;
  }

  public static async getPendingDisputesCount(req: Xrequest) {
    const accountDateFilter = DashboardService.getAccountDateFilter(req);
    const accountId: string = accountDateFilter.accountId;

    const commonAggregationStages: any = [
      {
        $lookup: {
          from: "cryptolistings",
          localField: "cryptoListing",
          foreignField: "_id",
          as: "cryptoListing",
        },
      },
      {
        $unwind: "$cryptoListing", // Unwind cryptoListing array
      },
      {
        $lookup: {
          from: "accounts", // The accounts collection to join with
          localField: "cryptoListing.account", // The field in the cryptoListing that links to the accounts collection
          foreignField: "_id", // Match it with the _id field in the accounts collection
          as: "cryptoListing.accountDetails", // The alias for the populated account
        },
      },
      {
        $unwind: {
          path: "$cryptoListing.accountDetails", // Unwind the accountDetails inside cryptoListing
          preserveNullAndEmptyArrays: true, // Optional: include entries even if there is no match for accountDetails
        },
      },
    ];

    const countAggregationPipeline: any = [
      ...commonAggregationStages,
      {
        $match: {
          $and: [
            {
              // Match orders for a specific accountId
              "cryptoListing.accountDetails._id": new mongoose.Types.ObjectId(
                accountId
              ),
            },
            {
              buyerFulfillmentClaim: "Disputed",
            },
            // dateFilter, // Apply the date filter dynamically
          ].filter(Boolean),
        },
      },
      { $count: "totalCount" },
    ];

    const disputesCount = await CryptoListingPurchase.aggregate(
      countAggregationPipeline
    );
    return disputesCount.length > 0 ? disputesCount[0].totalCount : 0;
  }

  public static async getReferralsData(req: Xrequest) {
    const accountDateFilter = DashboardService.getAccountDateFilter(req);
    const accountId: string = accountDateFilter.accountId;
    const account = await Accounts.findOne({ _id: accountId });

    if (!account) {
      return {
        status: false,
        message: "Unauthorized user",
      };
    }
    const totalRewardAmount = await ReferralReward.aggregate([
      {
        $match: { referralCode: account.referralCode },
      },
      {
        $group: {
          _id: null,
          totalRewardAmount: { $sum: "$rewardAmount" },
        },
      },
    ]);

    // If there are matching records, the totalRewardAmount will be in the first element
    return {
      totalEarning:
        totalRewardAmount.length > 0
          ? totalRewardAmount[0].totalRewardAmount
          : 0,
      totalJoined: account.referralCount,
      referralCode: account.referralCode,
    };
  }

  public static async getChartsData(req: Xrequest) {}

  public static async getPopularsData() {
    const now = new Date();

    // Helper function to compute start and end dates
    const getDateRange = (timePeriod: "today" | "thisWeek" | "thisMonth") => {
      let startDate: Date;
      let endDate: Date = now;

      if (timePeriod === "today") {
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          0,
          0,
          0,
          0
        );
      } else if (timePeriod === "thisWeek") {
        const currentWeekDay = now.getDay(); // 0 (Sunday) to 6 (Saturday)
        startDate = new Date(now);
        startDate.setDate(now.getDate() - currentWeekDay); // Start of the week
        startDate.setHours(0, 0, 0, 0);
      } else if (timePeriod === "thisMonth") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1); // Start of the month
      } else {
        throw new Error("Invalid time period");
      }

      return { startDate, endDate };
    };

    const buildPipeline: any = (
      timePeriod: "today" | "thisWeek" | "thisMonth"
    ) => {
      const { startDate, endDate } = getDateRange(timePeriod);
      return [
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate }, // Filter by date range
            paymentConfirmed: true,
          },
        },
        {
          $group: {
            _id: "$cryptoListing", // Group by the cryptoListing field
            count: { $sum: 1 }, // Count occurrences
          },
        },
        {
          $sort: { count: -1 }, // Sort by count in descending order
        },
        {
          $limit: 1, // Get the most popular item
        },
        {
          $lookup: {
            from: "cryptolistings", // Collection name for CryptoListing
            localField: "_id", // Field in the current collection
            foreignField: "_id", // Field in the CryptoListing collection
            as: "cryptoDetails", // Output field for populated data
          },
        },
        {
          $unwind: {
            path: "$cryptoDetails", // Unwind the array to simplify access
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 0,
            cryptoListing: "$cryptoDetails", // Rename the populated field
            count: 1,
          },
        },
      ];
    };

    const [mostPopularCryptoListingToday] =
      await CryptoListingPurchase.aggregate(buildPipeline("today"));
    const [mostPopularCryptoListingThisWeek] =
      await CryptoListingPurchase.aggregate(buildPipeline("thisWeek"));
    const [mostPopularCryptoListingThisMonth] =
      await CryptoListingPurchase.aggregate(buildPipeline("thisMonth"));

    return {
      today: mostPopularCryptoListingToday || { cryptoListing: null, count: 0 },
      thisWeek: mostPopularCryptoListingThisWeek || {
        cryptoListing: null,
        count: 0,
      },
      thisMonth: mostPopularCryptoListingThisMonth || {
        cryptoListing: null,
        count: 0,
      },
    };
  }

  public static async getPurchaseSpendData(req: Xrequest) {
    const accountDateFilter = DashboardService.getAccountDateFilter(req);
    const accountId: string = accountDateFilter.accountId;
    const dateFilterBackWard: any = accountDateFilter.dateFilter.backward;
    const dateFilterForWard: any = accountDateFilter.dateFilter.forward;

    const grouping = {
      $group: {
        _id: null,
        totalPurchaseSpend: { $sum: "$data.charged_amount" },
      },
    };

    const match: any = {
      $match: {
        $and: [{ account: new mongoose.Types.ObjectId(accountId) }].filter(
          Boolean
        ),
      },
    };

    const setAndgetMatch = (_dateFilter: any) => {
      if (req.query.timePeriod) {
        const lastCondition = match.$match.$and[match.$match.$and.length - 1];
        if (lastCondition && lastCondition.createdAt !== undefined) {
          lastCondition.createdAt = _dateFilter;
        } else {
          match.$match.$and.push({
            createdAt: _dateFilter,
          });
        }
      }
      return match;
    };

    const totalPurchaseSpendForward = await VerifiedTransactions.aggregate([
      setAndgetMatch(dateFilterForWard),
      grouping,
    ]);

    const totalPurchaseSpendBackward = await VerifiedTransactions.aggregate([
      setAndgetMatch(dateFilterBackWard),
      grouping,
    ]);

    const results: Data = {
      resultForward:
        totalPurchaseSpendForward.length > 0
          ? totalPurchaseSpendForward[0].totalPurchaseSpend
          : 0,
      resultBackward:
        totalPurchaseSpendBackward.length > 0
          ? totalPurchaseSpendBackward[0].totalPurchaseSpend
          : 0,
    };
    results.percentageChange = calculatePercentageChange(results);
    return results;
  }

  public static async getPendingOrdersData(req: Xrequest) {
    const accountDateFilter = DashboardService.getAccountDateFilter(req);
    const accountId: string = accountDateFilter.accountId;

    const commonAggregationStages: any = [
      {
        $lookup: {
          from: "cryptolistings",
          localField: "cryptoListing",
          foreignField: "_id",
          as: "cryptoListing",
        },
      },
      {
        $unwind: "$cryptoListing", // Unwind cryptoListing array
      },
      {
        $lookup: {
          from: "accounts", // The accounts collection to join with
          localField: "cryptoListing.account", // The field in the cryptoListing that links to the accounts collection
          foreignField: "_id", // Match it with the _id field in the accounts collection
          as: "cryptoListing.accountDetails", // The alias for the populated account
        },
      },
      {
        $unwind: {
          path: "$cryptoListing.accountDetails", // Unwind the accountDetails inside cryptoListing
          preserveNullAndEmptyArrays: true, // Optional: include entries even if there is no match for accountDetails
        },
      },
    ];

    const countAggregationPipeline: any = [
      ...commonAggregationStages,
      {
        $match: {
          $and: [
            {
              // Match orders for a specific accountId
              "cryptoListing.accountDetails._id": new mongoose.Types.ObjectId(
                accountId
              ),
            },
            {
              fulfillmentStatus: "Pending",
            },
            // dateFilter, // Apply the date filter dynamically
          ].filter(Boolean),
        },
      },
      { $count: "totalCount" },
    ];

    const pendingOrdersCount = await CryptoListingPurchase.aggregate(
      countAggregationPipeline
    );
    return pendingOrdersCount.length > 0 ? pendingOrdersCount[0].totalCount : 0;
  }

  public static async getRecentTransactions(req: Xrequest) {
    try {
      const accountId: string = req.accountId as string;
      let recentTransactions: any = await CryptoListingPurchase.find({
        account: accountId,
        paymentConfirmed: true,
      })
        .populate({
          path: "cryptoListing",
          populate: {
            path: "account",
            select: "avatar username provider",
          },
        })
        .sort({ createdAt: -1 })
        .limit(5);

      recentTransactions = JSON.parse(JSON.stringify(recentTransactions));

      for (let recentTransaction of recentTransactions) {
        let payment = await VerifiedTransactions.findOne({
          tx_ref: recentTransaction.checkOutId!,
        }).select("data");

        recentTransaction.payment = payment;
      }
      return recentTransactions;
    } catch (error: any) {
      return null;
    }
  }
}
