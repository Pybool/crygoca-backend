import { Request } from 'express';

interface Xrequest extends Request {
  accountId?: string; // Add the accountId property
  merchantAccountId?:string;
  authToken?: string;
  account?:any;
  merchantAccount?:any;
  merchantCredentials?:any;
  payload?:any;
  body:any;
}

export default Xrequest;
