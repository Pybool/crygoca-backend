import { redisClient } from "./init.redis";
const gredisClient = redisClient.generic;

export const setAccountData = async (
  googleId: string,
  prefix: string,
  data: any,
  EXP: number = 300
) => {
  try {
    const cacheKey = prefix + googleId;
    await gredisClient.set(cacheKey, JSON.stringify(data), "EX", EXP);
    return true;
  } catch {
    return false;
  }
};

export const getAccountData = async (
  prefix: string,
  googleId: string
) => {
  const cacheKey = prefix + googleId;
  const accountDataCached = await gredisClient.get(cacheKey);
  const ttl = await gredisClient.ttl(cacheKey);

  if (accountDataCached !== null && ttl >= 0) {
    return JSON.parse(accountDataCached);
  } else {
    await gredisClient.del(cacheKey);
    return null;
  }
};


export const deleteAccountData = async (key: string) => {
  await gredisClient.del(key);
};
