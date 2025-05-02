import cors, { CorsOptions } from "cors";
import app from "./_app";
import express, { Request, Response } from "express";
import http from "http";
import "../redis/init.redis";

// import "../redis-subscriber";
import "./init.mongo";
import compareRoute from "../routes/v1/compare.routes";
import liveRates from "../routes/v1/liveCurrencies.routes";
import authRouter from "../routes/v1/authentication.route";
import { config as dotenvConfig } from "dotenv";
import { getUserCountry } from "../services/v1/conversions/comparison.service";
import { sessionMiddleware } from "../middlewares/session";
import "../services/v1/tasks/scripts/cryptoLiveUpdates";
import "../services/v1/tasks/scripts/livecurrencies";
import "../services/v1/tasks/wallet/bankWithdrawals.worker";
import { Server as SocketIOServer } from "socket.io";
import { enquiriesService } from "../services/v1/contact/enquiries.service";
import liveCrypto from "../routes/v1/cryptoCurrencies.route";
import flwRouter from "../routes/v1/flutterwave.route";
import checkoutRouter from "../routes/v1/checkout.routes";
import ordersRouter from "../routes/v1/orders.routes";
import dashboardRouter from "../routes/v1/dashboard.routes";
import passport from "../services/v1/auth/passport-auth";
import session from "express-session";
import { SocialAuthentication } from "../services/v1/auth/authentication.social.service";
import { verifyGoogleToken } from "../middlewares/jwt";
import profileRouter from "../routes/v1/profile.routes";
import Accounts from "../models/accounts.model";
import payoutRouter from "../routes/v1/payouts.route";
import walletRouter from "../routes/v1/wallet.routes";
import { saveBanksForCountry } from "../services/v1/wallet/banks.service";
import { CustomSocket, socketAuth } from "../middlewares/socketAuth";
import { setupSocketHandlers } from "../controllers/v1/sockets/socket.controller";
import notificationRouter from "../routes/v1/notifications.routes";
import { generateReferralCode } from "../services/v1/helpers";
import "../services/v1/jobs/payment-verification/paymentVerificationWorker";
import { checkRedis } from "../middlewares/checkredis";
import { timeoutAutoConfirmation } from "../services/v1/jobs/payment-verification/timeoutAutoComplete";
import crypto from 'crypto';

dotenvConfig();
dotenvConfig({ path: `.env` });
// Create an Express application
const PORT = process.env.CRYGOCA_MAIN_SERVER_PORT! as string;
const SERVER_URL = "0.0.0.0";

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: "*",
  },
});
io.use(socketAuth);
const wrap =
  (middleware: any) => (socket: CustomSocket, next: (err?: any) => void) => {
    middleware(socket.request, {}, next);
  };
io.use(wrap(sessionMiddleware));
app.set("io", io);
setupSocketHandlers(io);

if (process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "prod") {
  app.use(
    cors({
      origin: [
        "http://localhost:4200",
        "http://localhost:4201",
        "https://www.crygoca.com",
        "https://crygoca.com",
        "https://marketplace.crygoca.com",
        "https://crygoca.co.uk",
        "https://www.crygoca.co.uk",
        "https://test.crygoca.com",
        "https://uatmarketplace.crygoca.com",
        "https://test.crygoca.co.uk",
        "https://uatmarketplace.crygoca.com"
      ], // Array of allowed origins // Explicitly specify the allowed origin
      credentials: true, // Allow cookies and credentials to be sent
    })
  );
}


// Configure body-parser or express.json() with a higher limit
app.use(express.json({ limit: "10mb" })); // Increase to 10MB or adjust as needed
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use(sessionMiddleware);

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.set("trust proxy", true);
app.use(express.json());
app.use(checkRedis);

app.get("/", async (req, res) => {
  timeoutAutoConfirmation()
  res.send("Crygoca Backend says hello!");
});

app.get("/ip", async (req, res) => {
  const result = await getUserCountry(req);
  res.send({
    status: true,
    data: result,
  });
});

const MOONPAY_WEBHOOK_SECRET = process.env.MOONPAY_WEBHOOK_SECRET!;

app.post('/webhook/moonpay', (req, res) => {
  const signature = req.headers['moonpay-signature'] as string;
  const payload = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac('sha256', MOONPAY_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).send('Invalid signature');
  }

  const event = req.body;
  console.log('MoonPay event:', event);
  res.sendStatus(200);
});

app.post("/save-banks", async (req, res) => {
  const countryCode = req.body.countryCode! as string;
  const banks = req.body.banks;
  const result = await saveBanksForCountry(banks, countryCode);
  res.send({
    status: true,
    data: result,
  });
});

// Login route
app.post("/auth/google", verifyGoogleToken, async (req: any, res) => {
  req.gAccount = req.user; // Save user in session
  if (
    req.query?.referralCode?.trim() !== "" &&
    req.query?.referralCode?.trim() !== null
  ) {
    req.referralCode = req.query.referralCode;
  }

  const result = await SocialAuthentication.googleAuthentication(req);
  res.status(200).send(result); // Return user data to frontend
});

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  async (req: any, res: any) => {
    res.redirect(
      `${process.env
        .CRYGOCA_SERVER_URL!}/auth/success?user=${encodeURIComponent(
          JSON.stringify(req.g_user)
        )}`
    );
  }
);

app.get("/auth/logout", (req: any, res: any) => {
  req.logout();
  res.redirect("/");
});


app.get("/profile", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  res.json(req.user);
});


app.get("/test-referal-code", async (req: any, res: any) => {
  const username = req.query.username! as string;
  const referralCode: string = await generateReferralCode(username);
  return res.status(200).json({
    status: true,
    message: " Referral code was generated",
    data: referralCode
  })
})

app.get("/test-payment-verification-job", async (req: any, res: any) => {
  const jobData = {
    eventName: "card-payment-verification",
    paymentReference: 123456,
    expectedAmount: 5000,
    expectedCurrency: "NGN",
  };
  // addJob(jobData)
  return res.status(200).json({
    status: true,
    message: " Referral code was generated",
  })
})

app.post("/api/v1/contact", enquiriesService);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1", compareRoute);
app.use("/api/v1", liveRates);
app.use("/api/v1", liveCrypto);
app.use("/api/v1", flwRouter);
app.use("/api/v1", checkoutRouter);
app.use("/api/v1", ordersRouter);
app.use("/api/v1", dashboardRouter);
app.use("/api/v1", payoutRouter);

app.use("/api/v1/profile", profileRouter);
app.use("/api/v1/wallet", walletRouter);
app.use("/api/v1/notifications", notificationRouter);

app.use(express.static("public"));
const staticFolder = process.env.PUBLIC_FOLDER! as string;
const oneYearInMilliseconds = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds

app.use(
  express.static(staticFolder, {
    maxAge: oneYearInMilliseconds, // Cache for 1 Year
    setHeaders: (res, path) => {
      res.setHeader(
        "Cache-Control",
        `public, max-age=${oneYearInMilliseconds}`
      );
    },
  })
);

app.use(express.static(process.env.PUBLIC_FOLDER_2!));


app.set("view engine", "ejs");
app.set("views", "src/templates");

function generateAsciiArt(text: string, env: string) {
  const length = text.length;
  const line = Array(length + 8)
    .fill("-")
    .join("");
  const emptyLine = "|" + " ".repeat(length + 6) + "|";

  return `
   ${line}
  |  ${text}  |
  |  😊 ${env} Server started successfully.            |
  |  🎧 Listening on port ${PORT}...                           |
  |  💿 Database: ${process.env.CRYGOCA_DATABASE_NAME}                                   |
  |  👨🏽‍💻Author: Emmanuel Eko @Adonyneus                |
   ${line}
  `;
}

// Start the server
server.listen(PORT, () => {
  let env = "Development"
  if (process.env.NODE_ENV === "prod") {
    env = "Production"
  }
  const serverMessage = generateAsciiArt(
    `Crygoca ${env} Server is running on ${SERVER_URL}:${PORT}`.toUpperCase(), env
  );
  console.log(serverMessage);
});
