import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import Xrequest from "../interfaces/extensions.interface";
import Accounts from "../models/accounts.model";
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client();
const SECRET_KEY: string = process.env.ACCESS_TOKEN_SECRET || "";

export const decode = (req: Xrequest, res: Response, next: any) => {
  const reqHeaders: any = req.headers;
  if (!reqHeaders["authorization"]) {
    return res
      .status(400)
      .json({ success: false, message: "No access token provided" });
  }

  const accessToken = reqHeaders.authorization.split(" ")[1];
  try {
    const decoded: any = jwt.verify(accessToken, SECRET_KEY);
    req.accountId = decoded.aud;
    return next();
  } catch (error: any) {
    return res.status(401).json({ success: false, message: error.message });
  }
};

export const decodeExt = (req: Xrequest, res: Response, next: any) => {
  const reqHeaders: any = req.headers;
  if (!reqHeaders["authorization"]) {
    return next();
  }

  const accessToken = reqHeaders.authorization.split(" ")[1];
  try {
    const decoded: any = jwt.verify(accessToken, SECRET_KEY);
    req.accountId = decoded.aud;
    return next();
  } catch (error: any) {
    return next();
  }
};

export function ensureAdmin(req: Xrequest, res: Response, next: NextFunction) {
  const account = req.account;
  if (account && account.admin) {
    next();
  } else {
    res.status(403).json({ message: "Forbidden: Account is not an admin" });
  }
}

// Middleware to verify the Google ID token
export async function verifyGoogleToken(
  req: Xrequest,
  res: Response,
  next: NextFunction
) {
  const idToken = req.body.idToken;
  if (!idToken) {
    return res.status(400).send({ error: "ID Token is required" });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID! as string,
    });

    const payload = ticket.getPayload();
    console.log("Payload ===> ", payload);
    req.user = {
      email: payload.email,
      fullname: payload.name,
      avatar: payload.picture,
      googleId: payload.sub,
      firstname: payload.given_name,
      lastname: payload.family_name
    };
    next();
  } catch (error) {
    res.status(401).send({ error: "Invalid ID Token" });
  }
}
