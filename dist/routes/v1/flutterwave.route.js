"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const flutterwave_controller_1 = require("../../controllers/v1/flutterwave.controller");
const axios_1 = __importDefault(require("axios"));
const flwRouter = express_1.default.Router();
flwRouter.post('/flw/initiate-payment', flutterwave_controller_1.flutterWaveController.initiateCardPayment);
flwRouter.post('/flw/verify-payment', flutterwave_controller_1.flutterWaveController.verifyCardPayment);
flwRouter.post('/flw/initiate-googlepay-payment', flutterwave_controller_1.flutterWaveController.initiateGooglePayPayment);
flwRouter.post('/flw/initiate-ach-payment', flutterwave_controller_1.flutterWaveController.initiateACHPayment);
flwRouter.get('/flw/convert-currencies', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const from = req.query.from;
        const to = req.query.to;
        const amount = parseFloat(req.query.amount);
        const BASE_URL = "https://api.flutterwave.com/v3";
        if (!from || !to) {
            return res.status(400).json({ error: 'Missing required query parameters: from and to' });
        }
        const url = `${BASE_URL}/rates?from=${from}&to=${to}&amount=${amount}`;
        const response = yield axios_1.default.get(url, {
            headers: {
                Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
            },
        });
        // Return the response from Flutterwave API
        res.status(200).json(response.data);
    }
    catch (error) {
        console.error('Error fetching conversion rate:', error);
        res.status(500).json({ error: 'Failed to fetch conversion rate' });
    }
}));
flwRouter.post("/flw/payment/webhook", (req, res) => {
    // Uncomment for production
    // const secretHash = process.env.FLW_SECRET_HASH;
    // const signature = req.headers["verif-hash"];
    // if (!signature || (signature !== secretHash)) {
    //     res.status(401).end();
    // }
    const event = req.body;
    // Handle the event data as required
    // console.log("Received Webhook Event:", event);
    // Check the event type and handle accordingly
    if (event.event === "payment.success") {
        // console.log("Payment was successful:", event.data);
        // Handle successful payment (e.g., update database, send notification, etc.)
    }
    else if (event.event === "payment.failed") {
        // console.log("Payment failed:", event.data);
        // Handle payment failure
    }
    // Respond to acknowledge receipt of the webhook
    res.status(200).send("Webhook received");
});
exports.default = flwRouter;
//Event
// {
//   event: 'charge.completed',
//   data: {
//     id: 8228269,
//     tx_ref: 'CR-0W86DUHN3H2A',
//     flw_ref: 'FLW-MOCK-3d3479f6e44660b21fdc71c3d50a3d47',
//     device_fingerprint: '2eb7a608aa8cfb1bd264ec145388d7f5',
//     amount: 1000,
//     currency: 'NGN',
//     charged_amount: 1000,
//     app_fee: 38,
//     merchant_fee: 0,
//     processor_response: 'Approved. Successful',
//     auth_model: 'VBVSECURECODE',
//     ip: '52.209.154.143',
//     narration: 'CARD Transaction ',
//     status: 'successful',
//     payment_type: 'card',
//     created_at: '2024-11-29T20:56:35.000Z',
//     account_id: 677359,
//     customer: {
//       id: 2542103,
//       name: 'roxandrea ',
//       phone_number: null,
//       email: 'eko.emmanuel14@yahoo.com',
//       created_at: '2024-11-29T20:56:35.000Z'
//     },
//     card: {
//       first_6digits: '418742',
//       last_4digits: '4246',
//       issuer: 'VISA ACCESS BANK PLC DEBIT CLASSIC',
//       country: 'NG',
//       type: 'VISA',
//       expiry: '09/32'
//     }
//   },
//   'event.type': 'CARD_TRANSACTION'
// }
