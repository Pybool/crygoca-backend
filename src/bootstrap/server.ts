import cors, { CorsOptions } from "cors";

import app from "./_app";

import express, { Request, Response } from "express";
import http from "http";
// import cors from "cors";
import "../redis/init.redis";
import "./init.mongo";
// import "../backgroundtasks/taskScheduler";
// import "./services/v1/tasks/task.service";
import compareRoute from "../routes/v1/compare.routes";
import liveRates from "../routes/v1/liveCurrencies.routes";
import authRouter from "../routes/v1/authentication.route";
import { config as dotenvConfig } from "dotenv";
import { getUserCountry } from "../services/v1/conversions/comparison.service";
import { sessionMiddleware } from "../middlewares/session";

import "../services/v1/tasks/flutterwave.service";
import "../services/v1/tasks/task.service";
import "../services/v1/tasks/cryptoLiveUpdates.service";

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

dotenvConfig();
dotenvConfig({ path: `.env.prod` });
// Create an Express application
const PORT = process.env.CRYGOCA_MAIN_SERVER_PORT! as string;
const SERVER_URL = "0.0.0.0";

const server = http.createServer(app);
// const corsOptions = {
//   origin: "*",
//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// };

// app.use(cors(corsOptions));

app.use(
  cors({
    origin: [
      "http://localhost:4200",
      "https://b1d7-105-119-6-63.ngrok-free.app",
      "https://test.crygoca.co.uk",
    ], // Array of allowed origins // Explicitly specify the allowed origin
    credentials: true, // Allow cookies and credentials to be sent
  })
);

// Configure body-parser or express.json() with a higher limit
app.use(express.json({ limit: '10mb' })); // Increase to 10MB or adjust as needed
app.use(express.urlencoded({ limit: '10mb', extended: true }));

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
app.get("/", async(req, res) => {
  res.send("Crygoca Backend says hello!");
});

app.get("/ip", async (req, res) => {
  const result = await getUserCountry(req);
  res.send({
    status: true,
    data: result,
  });
});

// Login route
app.post("/auth/google", verifyGoogleToken, async (req: any, res) => {
  req.gAccount = req.user; // Save user in session
  const result = await SocialAuthentication.googleAuthentication(req.gAccount);
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

// app.get("/auth/success", (req: any, res: any) => {
//   const userParam = req.query.user;

//   // Parse the user parameter if it exists
//   let userData;
//   let googleId = null;
//   if (userParam) {
//     try {
//       userData = JSON.parse(userParam);
//       console.log("Google userData ===> ", userData);
//       googleId = userData?.data?.googleId;
//       if (googleId) {
//         setAccountData(
//           userData?.data?.googleId,
//           "google-account-",
//           userData,
//           6000
//         );
//       }
//     } catch (error) {
//       console.error("Error parsing user data:", error);
//       return res.status(400).send("Invalid user data format.");
//     }
//   }

//   return res.send(`
//     <html>
//       <body>
//         <div>Authentication successful, redirecting...</div>
//         <script>
//           // Redirect to frontend
//           window.location.href = "${
//             process.env.CRYGOCA_FRONTEND_BASE_URL
//           }/dashboard?googleId=${googleId || ""}";
//         </script>
//       </body>
//     </html>
//   `);
// });

// app.get("/auth/get-google-account-info", async (req: any, res: any) => {
//   const googleId = req.query.googleId! as string;
//   const account = await getAccountData("google-account-", googleId);
//   console.log("Account ====> ", account);
//   return res.status(200).json(
//     account || {
//       status: false,
//       message: "Failed to get account info",
//     }
//   );
// });

// Protected route
app.get("/profile", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  res.json(req.user);
});

app.post("/api/v1/contact", enquiriesService);

app.use("/api/v1", compareRoute);
app.use("/api/v1", liveRates);
app.use("/api/v1", liveCrypto);
app.use("/api/v1", flwRouter);
app.use("/api/v1", checkoutRouter);
app.use("/api/v1", ordersRouter);
app.use("/api/v1", dashboardRouter);
app.use("/api/v1", payoutRouter);

app.use("/api/v1/profile", profileRouter);


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

app.use("/api/v1/auth", authRouter);
app.set("view engine", "ejs");
app.set("views", "src/templates");

function generateAsciiArt(text: string) {
  const length = text.length;
  const line = Array(length + 8)
    .fill("-")
    .join("");
  const emptyLine = "|" + " ".repeat(length + 6) + "|";

  return `
   ${line}
  |  ${text}  |
  |  😊 Development Server started successfully.            |
  |  🎧 Listening on port ${PORT}...                           |
  |  💿 Database: CRYGOCA                                   |
   ${line}
  `;
}

// Start the server
server.listen(PORT, () => {
  const serverMessage = generateAsciiArt(
    `Crygoca Development Server is running on ${SERVER_URL}:${PORT}`.toUpperCase()
  );
  console.log(serverMessage);
});
