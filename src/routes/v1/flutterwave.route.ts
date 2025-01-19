import express from "express";
import { flutterWaveController } from "../../controllers/v1/flutterwave.controller";
import axios from "axios";
import { FlutterWaveService } from "../../services/v1/payments/flutterwave.service";
import { getIntlBanksForCountry } from "../../services/v1/wallet/banks.service";

const flwRouter = express.Router();

flwRouter.post(
  "/flw/initiate-payment",
  flutterWaveController.initiateCardPayment
);
flwRouter.post("/flw/verify-payment", flutterWaveController.verifyCardPayment);

flwRouter.post(
  "/flw/initiate-googlepay-payment",
  flutterWaveController.initiateGooglePayPayment
);
flwRouter.post(
  "/flw/initiate-googlepay-tokenized-charge",
  flutterWaveController.googlePayTokenizedCharge
);

flwRouter.post(
  "/flw/initiate-ach-payment",
  flutterWaveController.initiateACHPayment
);

flwRouter.get("/flw/get-intl-banks", async (req, res) => {
  try {
    const countryCode = req.query.country as string;
    const result = await getIntlBanksForCountry(countryCode)
    return res.status(200).json(result);
  }
  catch (error) {
    console.error("Error fetching banks:", error);
    res.status(500).json({ error: "Failed to fetch banks" });
  }
})



flwRouter.get("/flw/get-banks", async (req, res) => {
  try {
    const country = req.query.country as string;
    const BASE_URL = "https://api.flutterwave.com/v3/banks/";

    if (!country) {
      return res
        .status(400)
        .json({ error: "Missing required query parameters: country" });
    }

    const url = `${BASE_URL}${country}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY!}`,
      },
    });

    // Return the response from Flutterwave API
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching banks:", error);
    res.status(500).json({ error: "Failed to fetch banks" });
  }
});



flwRouter.get(
  "/flw/get-bank-branches",
  (async(req, res)=>{
    try {
      const bankId = req.query.bankId as string;
      const BASE_URL = `https://api.flutterwave.com/v3/banks/${bankId}/branches`;
  
      if (!bankId) {
        return res
          .status(400)
          .json({ error: "Missing required query parameters: bankId" });
      }
  
      const url = `${BASE_URL}`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer FLWSECK_TEST-SANDBOXDEMOKEY-X`,
        },
      });
  
      // Return the response from Flutterwave API
      res.status(200).json(response.data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bank branches" });
    }
  })
);

flwRouter.get("/flw/convert-currencies", async (req, res) => {
  try {
    const from = req.query.from as string;
    const to = req.query.to as string;
    const amount = parseFloat(req.query.amount! as string);
    const BASE_URL = "https://api.flutterwave.com/v3";

    if (!from || !to) {
      return res
        .status(400)
        .json({ error: "Missing required query parameters: from and to" });
    }

    const url = `${BASE_URL}/rates?from=${from}&to=${to}&amount=${amount}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY!}`,
      },
    });

    // Return the response from Flutterwave API
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Error fetching conversion rate:", error);
    res.status(500).json({ error: "Failed to fetch conversion rate" });
  }
});




flwRouter.post("/flw/payment/webhook", async (req, res) => {
  // Uncomment for production
  // const secretHash = process.env.FLW_SECRET_HASH;
  // const signature = req.headers["verif-hash"];
  // if (!signature || (signature !== secretHash)) {
  //     res.status(401).end();
  // }

  const event = req.body;
  if (event.event === "payment.success") {
    res.status(200).send("Webhook received");
  } else if (event.event === "payment.failed") {
    res.status(200).send("Webhook received");
  }

  if (
    event.event === "charge.completed" &&
    event.data.payment_type === "googlepay"
  ) {
    // Respond to acknowledge receipt of the webhook
    console.log(
      "GooglePay Webhook Event ====> ",
      JSON.stringify(event, null, 2)
    );
    const verificationResponse = await FlutterWaveService.verifyCardPayment({
      paymentReference: event.data.id,
      expectedAmount: event.data.amount,
      expectedCurrency: event.data.currency?.toUpperCase(),
      payment_type: event.data.payment_type,
    },event.data);
    res.status(200).send({
      status: true,
      message: "Googlepay Webhook received",
      data: verificationResponse
    });
  }
});

export default flwRouter;
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
