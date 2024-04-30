import { RequestHandler } from "express";

export interface Icompare{
    compareExchangeProviders: RequestHandler;
    getUserCountry: RequestHandler
}