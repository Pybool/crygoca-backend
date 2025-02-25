import bcrypt from "bcryptjs";
import { redisClient } from "../../../redis/init.redis";
const crypto = require("crypto");

const gredisClient = redisClient.generic

export function generatePasswordResetHash(email: string, number: string) {
  // Combine email and number into a single string
  const input = `${email}:${number}`;

  // Create a SHA-256 hash using the input string
  const hash = crypto.createHash("sha256");

  // Update the hash with the input
  hash.update(input);

  // Return the hash as a hexadecimal string
  return hash.digest("hex");
}

export const setExpirableCode = async (
  email: string,
  prefix: string,
  code: string,
  EXP: number = 300
) => {
  const cacheKey = prefix + email;
  await gredisClient.set(
    cacheKey,
    JSON.stringify({ email: email, code: code }),
    "EX",
    EXP
  );
};

export const setExpirablePhoneCode = async (
  phone: string,
  prefix: string,
  code: string,
  EXP: number = 300
) => {
  const cacheKey = prefix + phone;
  await gredisClient.set(
    cacheKey,
    JSON.stringify({ phone: phone, code: code }),
    "EX",
    EXP
  );
};

export const getExpirablePhoneCode = async (prefix: string, phone: string) => {
  const cacheKey = prefix + phone;
  const codeCached = await gredisClient.get(cacheKey);
  const ttl = await gredisClient.ttl(cacheKey);

  if (codeCached !== null && ttl >= 0) {
    return JSON.parse(codeCached);
  } else {
    await gredisClient.del(cacheKey);
    return null;
  }
};

export const setExpirableAccountData = async (
  email: string,
  prefix: string,
  data: any,
  EXP: number = 300
) => {
  try {
    const cacheKey = prefix + email;
    await gredisClient.set(cacheKey, JSON.stringify(data), "EX", EXP);
    return true;
  } catch {
    return false;
  }
};

export const getExpirableCode = async (prefix: string, email: string) => {
  const cacheKey = prefix + email;
  const codeCached = await gredisClient.get(cacheKey);
  const ttl = await gredisClient.ttl(cacheKey);

  if (codeCached !== null && ttl >= 0) {
    return JSON.parse(codeCached);
  } else {
    await gredisClient.del(cacheKey);
    return null;
  }
};

export const getExpirableAccountData = async (
  prefix: string,
  email: string
) => {
  const cacheKey = prefix + email;
  const accountDataCached = await gredisClient.get(cacheKey);
  const ttl = await gredisClient.ttl(cacheKey);

  if (accountDataCached !== null && ttl >= 0) {
    return JSON.parse(accountDataCached);
  } else {
    await gredisClient.del(cacheKey);
    return null;
  }
};

export const generateOtp = () => {
  const otp: number = Math.floor(1000 + Math.random() * 9000);
  return otp.toString();
};

export async function makePassword(password: string) {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    throw error;
  }
}

export const deleteExpirableCode = async (key: string) => {
  await gredisClient.del(key);
};


// Function to normalize phone numbers
export const normalizePhoneNumber = (countryCode: any, phone: string) => {
  const dialCode = countryCode;

  if (!dialCode) {
    throw new Error("Invalid country code");
  }

  // Remove all non-numeric characters
  let normalizedPhone = phone!.replace(/\D/g, "");

  // If the phone number starts with '0', replace it with the dial code
  if (normalizedPhone.startsWith("0")) {
    normalizedPhone = dialCode + normalizedPhone.slice(1);
  }

  // If the phone number doesn't start with the dial code, prepend it
  if (!normalizedPhone.startsWith(dialCode)) {
    normalizedPhone = dialCode + normalizedPhone;
  }

  return normalizedPhone;
};

// export const getGeolocation = (req: Xrequest) => {
//   let ipAddress = req.ip!
//   if (ipAddress.startsWith('::ffff:')) {
//     ipAddress = ipAddress.substr(7);
//   }
//   return new Promise((rs: any, rj: any) => {
//     const geo = geoip.lookup(ipAddress);
//     if (geo && geo.ll) {
//       const latitude = geo.ll[0];
//       const longitude = geo.ll[1];
//       rs({
//         latitude,
//         longitude,
//       });
//     } else {
//       rs(null);
//     }
//   });
// };
