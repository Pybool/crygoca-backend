import { Request, Response, NextFunction } from "express";
import MerchantCredentials from "../models/merchant-credentials.model";
import Xrequest from "../interfaces/extensions.interface";

export const validatePublicKey = async (req: Xrequest, res: Response, next: NextFunction) => {
  try {
    const publicKey = req.headers["x-api-key"] as string;

    if (!publicKey) {
      return res.status(401).json({
        status: false,
        message: "Unauthorized: Missing public key (x-api-key)",
      });
    }

    const publicKeyPattern = /^(CRY-PUB-(LIVE|TEST)-)/;

    if (!publicKeyPattern.test(publicKey)) {
      return res.status(403).json({
        status: false,
        message: "Forbidden: Invalid public key format",
      });
    }

    const keyType = publicKey.includes("LIVE") ? "live" : "test";

    const merchantCredentials = await MerchantCredentials.findOne({
      [`${keyType}PublicKey`]: publicKey,
    });

    if (!merchantCredentials) {
      return res.status(403).json({
        status: false,
        message: "Forbidden: Invalid public key",
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
