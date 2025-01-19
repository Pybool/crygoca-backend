import jwt from "jsonwebtoken";
import { Socket } from "socket.io";
import { config as dotenvConfig } from "dotenv";
import { Types } from "mongoose";
import Accounts from "../models/accounts.model";

dotenvConfig();
dotenvConfig({ path: `.env` });

export interface CustomSocket extends Socket {
  // request: any;
  user?: any;
  token?: string;
}
type NextFunction = (err?: Error) => void;

async function authenticateToken(token: string) {
  try {
    const SECRET_KEY: string = process.env.ACCESS_TOKEN_SECRET!;
    const decoded: any = jwt.verify(token, SECRET_KEY);
    let user = await Accounts.findOne({
      _id: new Types.ObjectId(decoded.aud!),
    });
    if (!user) {
      return {
        status: false,
        message: "No associated user was found for the jwt token",
      };
    }
    if (user) {
      return { status: true, user: user };
    }
    return { status: false };
  } catch (error: any) {
    console.log(error);
    return { status: false };
  }
}

export const socketAuth = async (socket: any, next: NextFunction) => {
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  const deviceId = socket.handshake.auth.deviceId || socket.handshake.query.deviceId;;
  if (!token && !deviceId) {
    console.log("Authentication error no token or deviceId in request");
    return next(
      new Error("Authentication error no token or deviceId in request")
    );
  }

  try {
    let result;
    if (token) {
      result = await authenticateToken(token);
    } else {
      result = { status: true, user: deviceId };
    }

    if (result.status) {
      socket.user = result?.user!;
      socket.token = token || deviceId || undefined;
      next();
    } else {
      console.log("Error ", "Authentication error");
      next(new Error("Authentication error"));
    }
  } catch (error) {
    console.log("Error ", error);
    next(new Error("Authentication error"));
  }
};
