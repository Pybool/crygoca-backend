import mongoose, { Schema } from "mongoose";
import Accounts from "../models/Accounts/accounts.model";
import Subscription from "../models/Subscriptions/subscriptions.model";

// Helper functions for random data generation
function getRandomString(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getRandomPhone(): string {
  return "234" + Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

function getRandomRole(): string {
  const roles = ["ADMIN", "ENGAGER", "INFLUENCER"];
  return roles[Math.floor(Math.random() * roles.length)];
}

function getRandomPlanType(): string {
  const plans = ["Basic", "Standard", "Premium", "Enterprise"];
  return plans[Math.floor(Math.random() * plans.length)];
}

function getBackdatedDate(months: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date;
}

// Function to create random users with optional subscriptions for influencers
export async function generateRandomUsers(count: number) {
  const users = [];
  const subscriptions: any = [];

  for (let i = 0; i < count; i++) {
    const role = getRandomRole();
    const user = {
      xid: getRandomString(10),
      xusername: `user${i}`,
      xdisplayName: `User ${i}`,
      xtoken: getRandomString(20),
      xtokenSecret: getRandomString(20),
      email: `user${i}@tweetcommerce.com`,
      countryCode: "NG",
      phone: getRandomPhone(),
      role: role,
      active: true,
      createdAt: new Date(),
      lastLogin: Math.random() > 0.5 ? new Date() : null,
    };

    users.push(user);

    // If the user is an influencer, create a subscription
    if (role === "INFLUENCER") {
      const startDate = Math.random() > 0.5 ? getBackdatedDate(2) : new Date();
      const endDate = Math.random() > 0.5 ? getBackdatedDate(1) : null; // 50% chance of being expired
      const subscription = {
        startDate: startDate,
        endDate: endDate,
        transaction: null,
        planType: getRandomPlanType(),
        account: null, // Placeholder, will be replaced once user is created
        active: !endDate || endDate > new Date(), // Active if no endDate or endDate is in the future
      };

      subscriptions.push(subscription);
    }
  }

  try {
    // Create all users and retrieve their IDs
    const createdUsers = await Accounts.create(users);
    console.log(`${count} users created successfully!`);

    // Assign account IDs to influencer subscriptions
    let subIndex = 0;
    for (
      let i = 0;
      i < createdUsers.length && subIndex < subscriptions.length;
      i++
    ) {
      const user = createdUsers[i];
      if (user.role === "INFLUENCER" && subscriptions[subIndex]) {
        subscriptions[subIndex].account = user._id;
        subIndex++;
      }
    }

    // Filter out any unassigned subscriptions (in case of mismatch)
    const validSubscriptions = subscriptions.filter((sub: any) => sub.account);

    // Create all subscriptions
    await Subscription.create(validSubscriptions);
    console.log(
      `${validSubscriptions.length} subscriptions created successfully!`
    );
  } catch (error) {
    console.error("Error creating users and subscriptions:", error);
  }
}
