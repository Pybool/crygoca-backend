import Accounts from "../../models/accounts.model";

const crypto = require("crypto");


// Helper method to generate a random alphanumeric string of a given length
function generateRandomString(length: number) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    const randomValue = randomBytes[i] % characters.length;
    result += characters[randomValue];
  }
  return result;
}

export function generateReferenceCode(prefix: string = "CR-"): string {
  const randomString = generateRandomString(8);
  const timestamp = Date.now().toString(36).slice(-4);
  return (prefix + randomString + timestamp).toUpperCase();
}

export const generateShortTimestamp = (): string => {
  // Get the current timestamp in seconds
  const timestamp = Math.floor(Date.now() / 1000);
  // Convert to Base36 and ensure it's uppercase
  const base36Timestamp = timestamp.toString(36).toUpperCase();

  // Calculate the number of random characters needed
  const randomCharsLength = Math.max(8 - base36Timestamp.length, 0);
  // Generate random characters
  const randomChars = Math.random()
    .toString(36)
    .substring(2, 2 + randomCharsLength)
    .toUpperCase();

  // Combine the timestamp and random characters
  return (base36Timestamp + randomChars).substring(0, 8);
};



export const generateReferralCode = async (userReference: any): Promise<string> => {
  const minLength = 8;
  const maxLength = 10;
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

  const generateCode = (): string => {
    let referralCode = userReference!.substring(0, Math.min(4, minLength)).toUpperCase(); // Take up to the first 4 characters of userReference

    // Calculate the length of the random part to ensure total length is between minLength and maxLength
    const randomPartLength = Math.max(minLength - referralCode.length, 0);
    for (let i = 0; i < randomPartLength; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      referralCode += chars[randomIndex];
    }

    // If referralCode exceeds maxLength, truncate it
    if (referralCode.length > maxLength) {
      referralCode = referralCode.substring(0, maxLength);
    }

    return referralCode.toUpperCase();
  };

  try{
    let referralCode = generateCode();
    let attempts = 0;
    const MAX_ATTEMPTS = 10;
  
    while (attempts < MAX_ATTEMPTS) {
      const alreadyExists = await Accounts.findOne({ referralCode });
      if (!alreadyExists) {
        return referralCode; // Unique referral code found
      }
      // Generate a new code and retry
      referralCode = generateCode();
      attempts++;
    }
  
    return generateShortTimestamp();

  }catch{
    return generateShortTimestamp();
  }

  
};


export function formatTimestamp(timestamp: string): string {
  // Create a Date object from the given timestamp
  const date = new Date(timestamp);

  // Define the formatting options
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true, // To use 12-hour format with AM/PM
  };

  // Create a formatter with the given options
  const formatter = new Intl.DateTimeFormat("en-US", options);

  // Format and return the date
  return formatter.format(date);
}
