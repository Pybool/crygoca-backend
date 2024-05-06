import { RequestHandler } from "express";

export interface IWebHook{
    telcoReceivedSms: RequestHandler
}