import { Request } from 'express';

interface Xrequest extends Request {
  accountId?: string; // Add the accountId property
  authToken?: string;
  account?:any;
  payload?:any;
  body:any;
}

export default Xrequest;
