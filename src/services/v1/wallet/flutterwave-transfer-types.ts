export interface ITransferPayloadNGN {
  account_bank: string;
  account_number: string;
  amount: number;
  narration: string;
  currency: string;
  reference: string;
  callback_url: string;
  debit_currency: string;
}

export interface ItransferPayloadGHS {
  account_bank: string;
  account_number: string;
  amount: number;
  narration: string;
  currency: string;
  reference: string;
  callback_url: string;
  destination_branch_code: string;
  beneficiary_name: string;
}

export interface IUSDDomBeneficiaryMeta {
  first_name: string;
  last_name: string;
  email: string;
  beneficiary_country: string;
  mobile_number: string;
  sender: string;
  merchant_name: string;
}

export interface ITransferPayloadNGNtoUSDdom {
  account_bank: string;
  account_number: string;
  amount: number;
  narration: string;
  currency: string;
  reference: string;
  debit_currency: string;
  beneficiary_name: string;
  meta: IUSDDomBeneficiaryMeta[];
}

export interface IUSDBeneficiaryMeta {
  account_number: string;
  routing_number: string;
  swift_code: string;
  bank_name: string;
  beneficiary_name: string;
  beneficiary_address: string;
  beneficiary_country: string;
}

export interface ItransferPayloadToUSD {
  amount: number;
  narration: string;
  currency: string;
  reference: string;
  beneficiary_name: string;
  meta: IUSDBeneficiaryMeta[];
}

export interface ItransferPayloadEURGBPMeta {
  account_number: string;
  routing_number: string;
  swift_code: string;
  bank_name: string;
  beneficiary_name: string;
  beneficiary_country: string;
  postal_code: string;
  street_number: string;
  street_name: string;
  city: string;
}

export interface ItransferPayloadEURorGBP {
  amount: number;
  narration: string;
  currency: string;
  reference: string;
  beneficiary_name: string;
  meta: ItransferPayloadEURGBPMeta[];
}

export interface ItransferPayloadZarMeta {
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  recipient_address: string;
}

export interface ItransferPayloadZAR {
  account_bank: string;
  account_number: number;
  amount: number;
  narration: string;
  currency: string;
  reference: string;
  debit_currency: string;
  beneficiary_name: string;
  callback_url: string;
  meta: ItransferPayloadZarMeta[];
}

export interface ItransferPayloadKES {
  account_bank: string;
  account_number: string;
  amount: number;
  narration: string;
  currency: string;
  reference: string;
  debit_currency: string;
  beneficiary_name: string;
  callback_url: string;
  meta: {
    sender: string;
    sender_country: string;
    mobile_number: string;
  }[];
}

export interface ItransferPayloadTZS {
  account_number: string;
  account_bank: string;
  amount: number;
  currency: string;
  narration: string;
  beneficiary_name: string;
  meta: {
    sender: string;
    sender_country: string;
    sender_address: string;
  }[];
}

export interface ItransferPayloadKESMOMO {
  account_bank: string;
  account_number: string;
  amount: number;
  narration: string;
  currency: string;
  reference: string;
  beneficiary_name: string;
  meta: {
    sender: string;
    sender_country: string;
    mobile_number: string;
  }[];
}

export interface ItransferPayloadGHSMOMO {
  account_bank: string;
  account_number: string;
  amount: number;
  narration: string;
  currency: string;
  reference: string;
  beneficiary_name: string;
}
