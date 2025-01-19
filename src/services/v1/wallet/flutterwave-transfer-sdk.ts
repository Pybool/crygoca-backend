import {
    ItransferPayloadGHS,
  ITransferPayloadNGN,
  ITransferPayloadNGNtoUSDdom,
} from "./flutterwave-transfer-types";

export class CrygocaFlutterwaveSdk {
  private secretKey: string;

  // Constructor to accept and store the secret key
  constructor(secretKey: string) {
    if (!secretKey) {
      throw new Error("Secret key is required to initialize the SDK.");
    }
    this.secretKey = secretKey;
  }

  // Method to make transfer
  public async makeTransfer(payload: any): Promise<any> {
    const url = "https://api.flutterwave.com/v3/transfers";
    return await this.makeRequest(url, payload);
  }

  public async retryTransfer(id:number){
    const url = `https://api.flutterwave.com/v3/transfers/${id}/retries`;
    return await this.makeRequest(url);
  }

  public async getTransfer(id:number){
    const url = `https://api.flutterwave.com/v3/transfers/${id}`
    return await this.makeGetRequest(url);
  }

  private async makeGetRequest(endpoint:string){
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.secretKey}`, // Use the secret key
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Failed to fetch transfer: ${error.message || response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error while making request:", error);
      throw error;
    }
  }

  // Private utility function to make HTTP requests
  private async makeRequest(endpoint: string, data?: any): Promise<any> {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.secretKey}`, // Use the secret key
        },
        body: JSON.stringify(data || {}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Failed to make transfer: ${error.message || response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error while making request:", error);
      throw error;
    }
  }
}
