import { RequestHandler } from "express";

export interface IprocessAndSave {
  status: boolean; // Add the accountId property
  id:string;
  message: string;
}

export interface ITelcoResponse {
    status?: boolean;
    phone?: string;
  }

export interface IuploadRequest{
  email:string;
  phone: string;
  comment: string;
  images: string[];
}

export interface ValidationStatus {
  status: boolean;
  error: string;
}

export interface IAuthorizePost{
  code:string;
  postRef:string;
}

export interface IUpload{
  newUploadRequest:RequestHandler ;
  verifyAuthorizationCode: RequestHandler ;
}
