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
