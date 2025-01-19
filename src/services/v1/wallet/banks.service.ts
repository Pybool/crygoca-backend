import Banks from "../../../models/banks.model";
import axios from "axios";
// Create FormData instance
const FormData = require("form-data");

export const saveBanksForCountry = async (banks: any, countryCode: string) => {
  for (let bank of banks) {
    await Banks.create({
      countryCode: countryCode,
      name: bank.value,
    });
  }
  return "Completed Successfully";
};

export const getIntlBanksForCountry = async (countryCode: string) => {
  try {
    const banks = await Banks.find({ countryCode: countryCode });
    return {
      status: true,
      data: banks,
    };
  } catch (error: any) {
    throw error;
  }
};
