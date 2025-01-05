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
const cors_1 = __importDefault(require("cors"));
const _app_1 = __importDefault(require("./_app"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
// import cors from "cors";
require("../redis/init.redis");
require("./init.mongo");
// import "../backgroundtasks/taskScheduler";
// import "./services/v1/tasks/task.service";
const compare_routes_1 = __importDefault(require("../routes/v1/compare.routes"));
const liveCurrencies_routes_1 = __importDefault(require("../routes/v1/liveCurrencies.routes"));
const authentication_route_1 = __importDefault(require("../routes/v1/authentication.route"));
const dotenv_1 = require("dotenv");
const comparison_service_1 = require("../services/v1/conversions/comparison.service");
const session_1 = require("../middlewares/session");
require("../services/v1/tasks/flutterwave.service");
require("../services/v1/tasks/task.service");
require("../services/v1/tasks/cryptoLiveUpdates.service");
const enquiries_service_1 = require("../services/v1/contact/enquiries.service");
const cryptoCurrencies_route_1 = __importDefault(require("../routes/v1/cryptoCurrencies.route"));
const flutterwave_route_1 = __importDefault(require("../routes/v1/flutterwave.route"));
const checkout_routes_1 = __importDefault(require("../routes/v1/checkout.routes"));
const orders_routes_1 = __importDefault(require("../routes/v1/orders.routes"));
const dashboard_routes_1 = __importDefault(require("../routes/v1/dashboard.routes"));
const passport_auth_1 = __importDefault(require("../services/v1/auth/passport-auth"));
const express_session_1 = __importDefault(require("express-session"));
const authentication_social_service_1 = require("../services/v1/auth/authentication.social.service");
const jwt_1 = require("../middlewares/jwt");
const profile_routes_1 = __importDefault(require("../routes/v1/profile.routes"));
const payouts_route_1 = __importDefault(require("../routes/v1/payouts.route"));
(0, dotenv_1.config)();
(0, dotenv_1.config)({ path: `.env.prod` });
// Create an Express application
const PORT = process.env.CRYGOCA_MAIN_SERVER_PORT;
const SERVER_URL = "0.0.0.0";
const server = http_1.default.createServer(_app_1.default);
// const corsOptions = {
//   origin: "*",
//   methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// };
// app.use(cors(corsOptions));
_app_1.default.use((0, cors_1.default)({
    origin: [
        "http://localhost:4200",
        "https://b1d7-105-119-6-63.ngrok-free.app",
        "https://test.crygoca.co.uk",
    ], // Array of allowed origins // Explicitly specify the allowed origin
    credentials: true, // Allow cookies and credentials to be sent
}));
// Configure body-parser or express.json() with a higher limit
_app_1.default.use(express_1.default.json({ limit: '10mb' })); // Increase to 10MB or adjust as needed
_app_1.default.use(express_1.default.urlencoded({ limit: '10mb', extended: true }));
_app_1.default.use(session_1.sessionMiddleware);
_app_1.default.use((0, express_session_1.default)({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
}));
_app_1.default.use(passport_auth_1.default.initialize());
_app_1.default.use(passport_auth_1.default.session());
_app_1.default.set("trust proxy", true);
_app_1.default.use(express_1.default.json());
_app_1.default.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.send("Crygoca Backend says hello!");
}));
_app_1.default.get("/ip", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield (0, comparison_service_1.getUserCountry)(req);
    res.send({
        status: true,
        data: result,
    });
}));
// Login route
_app_1.default.post("/auth/google", jwt_1.verifyGoogleToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    req.gAccount = req.user; // Save user in session
    const result = yield authentication_social_service_1.SocialAuthentication.googleAuthentication(req.gAccount);
    res.status(200).send(result); // Return user data to frontend
}));
_app_1.default.get("/auth/google/callback", passport_auth_1.default.authenticate("google", { failureRedirect: "/" }), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.redirect(`${process.env
        .CRYGOCA_SERVER_URL}/auth/success?user=${encodeURIComponent(JSON.stringify(req.g_user))}`);
}));
_app_1.default.get("/auth/logout", (req, res) => {
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
_app_1.default.get("/profile", (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(req.user);
});
_app_1.default.post("/api/v1/contact", enquiries_service_1.enquiriesService);
_app_1.default.use("/api/v1", compare_routes_1.default);
_app_1.default.use("/api/v1", liveCurrencies_routes_1.default);
_app_1.default.use("/api/v1", cryptoCurrencies_route_1.default);
_app_1.default.use("/api/v1", flutterwave_route_1.default);
_app_1.default.use("/api/v1", checkout_routes_1.default);
_app_1.default.use("/api/v1", orders_routes_1.default);
_app_1.default.use("/api/v1", dashboard_routes_1.default);
_app_1.default.use("/api/v1", payouts_route_1.default);
_app_1.default.use("/api/v1/profile", profile_routes_1.default);
_app_1.default.use(express_1.default.static("public"));
const staticFolder = process.env.PUBLIC_FOLDER;
const oneYearInMilliseconds = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
_app_1.default.use(express_1.default.static(staticFolder, {
    maxAge: oneYearInMilliseconds, // Cache for 1 Year
    setHeaders: (res, path) => {
        res.setHeader("Cache-Control", `public, max-age=${oneYearInMilliseconds}`);
    },
}));
_app_1.default.use("/api/v1/auth", authentication_route_1.default);
_app_1.default.set("view engine", "ejs");
_app_1.default.set("views", "src/templates");
function generateAsciiArt(text) {
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
    const serverMessage = generateAsciiArt(`Crygoca Development Server is running on ${SERVER_URL}:${PORT}`.toUpperCase());
    console.log(serverMessage);
});
