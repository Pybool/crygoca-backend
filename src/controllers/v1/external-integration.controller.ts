import Xrequest from "../../interfaces/extensions.interface";
import { Response } from "express";
import MerchantAccounts from "../../models/accounts-merchant.model";
import { generateKeys } from "../../services/v1/externalIntegration/credentials";
import MerchantCredentials from "../../models/merchant-credentials.model";
import {MerchantAuthService, ImerchantAuth } from "../../services/v1/externalIntegration/accounts.service";

export const createMerchantAccount = async (req: Xrequest, res: Response) => {
    try {
        const payload: ImerchantAuth = req.body;
        const response = await MerchantAuthService.register(payload)
        return res.status(200).json(response);
    } catch (error: any) {
        res.status(500).json({ status: false, message: error.message });
    }
}

export const generateNewCredentials = async (req: Xrequest, res: Response) => {
    try {
        const merchantAccountId = req.merchantAccountId;

        // Validate if account exists
        const account = await MerchantAccounts.findById(merchantAccountId);
        if (!account) {
            return res.status(400).json({
                status: false,
                message: "No account found for business",
            });
        }

        // Generate new keys
        const newCredentials = {
            testPublicKey: generateKeys("public", "test"),
            testSecretKey: generateKeys("secret", "test"),
            livePublicKey: generateKeys("public", "live"),
            liveSecretKey: generateKeys("secret", "live"),
        };

        // Find and update or create a new entry
        const merchantCredentials = await MerchantCredentials.findOneAndUpdate(
            { account: merchantAccountId },
            {
                ...newCredentials,
                account: merchantAccountId
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        // Mask live secret key before sending response
        return res.status(200).json({
            status: true,
            message: "Credentials generated successfully",
            data: {
                account: merchantCredentials.account,
                testPublicKey: merchantCredentials.testPublicKey,
                testSecretKey: merchantCredentials.testSecretKey,
                livePublicKey: merchantCredentials.livePublicKey,
                liveSecretKey: "******************************", // Hide secret key
                createdAt: merchantCredentials.createdAt,
                updatedAt: merchantCredentials.updatedAt,
            },
        });
    } catch (error: any) {
        console.error("Error generating credentials:", error);
        res.status(500).json({ status: false, error: error.message });
    }
};
