import { CrygocaFlutterwaveSdk } from "./flutterwave-transfer-sdk";

export const flutterwaveKeys = {
  PUBLIC: process.env.FLW_PUBLIC_KEY as string,
  SECRET: process.env.FLW_SECRET_KEY as string,
  ENC_KEY: process.env.FLW_ENCRYPTION_KEY as string,
};
// Initialize SDK with the Flutterwave secret key
const flutterwaveSdk = new CrygocaFlutterwaveSdk(flutterwaveKeys.SECRET);

export const withdrawToLocalBankHandler = async (payload: any) => {
  return await flutterwaveSdk.makeTransfer(payload);
};

export const getTransfer = async (id: number) => {
  return await flutterwaveSdk.getTransfer(id);
};
