import { RequestHandler } from "express";

export interface IAdmin {
  getIgPostRequests: RequestHandler;
  pushIgPostRequest:RequestHandler;
  toggleUserAdminStatus: RequestHandler;
}
