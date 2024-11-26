import jwt from 'jsonwebtoken';
import {Request, Response, NextFunction} from 'express';
import Xrequest from '../interfaces/extensions.interface';
import Accounts from '../models/accounts.model';

const SECRET_KEY:string = process.env.ACCESS_TOKEN_SECRET || ''; 

export const decode = (req:Xrequest, res:Response, next:any) => {
  const reqHeaders:any = req.headers
    if (!reqHeaders['authorization']) {
      return res.status(400).json({ success: false, message: 'No access token provided' });
    }

  
  const accessToken = reqHeaders.authorization.split(' ')[1];
  try {
    const decoded:any = jwt.verify(accessToken, SECRET_KEY);
    req.accountId = decoded.aud;
    return next();
  } catch (error:any) {
    return res.status(401).json({ success: false, message: error.message });
  }
}

export function ensureAdmin(req:Xrequest, res:Response, next:NextFunction) {
  const account = req.account;
  if (account && account.admin) {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Account is not an admin' });
  }
}
