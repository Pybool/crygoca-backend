"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.achChargeSuccess = void 0;
exports.achChargeSuccess = {
    status: "success",
    message: "Charge initiated",
    data: {
        id: 4962269,
        tx_ref: "ACH1234567x01",
        flw_ref: "FKYJ50811710276768063172919",
        device_fingerprint: "62wd23423rq324323qew1",
        amount: 100,
        charged_amount: 100,
        app_fee: 3.4,
        merchant_fee: 0,
        processor_response: "Request Accepted",
        auth_model: "AUTH",
        currency: "USD",
        ip: "54.75.161.64",
        narration: "Flutterwave Developers",
        status: "pending",
        auth_url: "https://mx-middleware.dev-flutterwave.com/transactions?reference=FKYJ50811710276768063172919",
        payment_type: "account-ach-us",
        fraud_status: "ok",
        charge_type: "normal",
        created_at: "2024-03-12T20:52:47.000Z",
        account_id: 20937,
        customer: {
            id: 2006690,
            phone_number: "0902620185",
            name: "Yolande Aglaé",
            email: "user@example.com",
            created_at: "2023-03-21T14:22:25.000Z",
        },
        meta: {
            authorization: {
                mode: "redirect",
                redirect: "https://mx-middleware.dev-flutterwave.com/transactions?reference=FKYJ50811710276768063172919",
                validate_instructions: "",
            },
        },
    },
};
