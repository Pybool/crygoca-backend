import { Request, Response, NextFunction } from "express";
import MerchantCredentials from "../models/merchant-credentials.model";
import Xrequest from "../interfaces/extensions.interface";

export const validateSecretKey = async (req: Xrequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers['x-api-key']! as string;

        if (!authHeader) {
            return res.status(401).json({
                status: false,
                message: "Unauthorized: Missing secret key (x-api-key)",
            });
        }

        const secretKey = authHeader as string;
        const keyPattern = /^(CRY-SEC-(LIVE|TEST)-)/;
        

        if (!keyPattern.test(secretKey)) {
            return res.status(403).json({
                status: false,
                message: "Forbidden: Invalid secret key format",
            });
        }

        const keyType = secretKey.includes("LIVE") ? "live" : "test";

        const merchantCredentials = await MerchantCredentials.findOne({
            [`${keyType}SecretKey`]: secretKey,
        });

        if (!merchantCredentials) {
            return res.status(403).json({
                status: false,
                message: "Forbidden: Invalid secret key",
            });
        }

        req.merchantCredentials = merchantCredentials;
        next();
    } catch (error: any) {
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
