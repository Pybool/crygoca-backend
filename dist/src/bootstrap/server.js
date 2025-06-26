"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
process.on("uncaughtException", (err) => {
    console.error("💥 Uncaught exception:", err);
});
process.on("unhandledRejection", (reason) => {
    console.error("💥 Unhandled promise rejection:", reason);
});
const cors_1 = __importDefault(require("cors"));
const _app_1 = __importDefault(require("./_app"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
require("../redis/init.redis");
require("./init.mongo");
const compare_routes_1 = __importDefault(require("../routes/v1/compare.routes"));
const liveCurrencies_routes_1 = __importDefault(require("../routes/v1/liveCurrencies.routes"));
const authentication_route_1 = __importDefault(require("../routes/v1/authentication.route"));
const dotenv_1 = require("dotenv");
const comparison_service_1 = require("../services/v1/conversions/comparison.service");
const session_1 = require("../middlewares/session");
require("../services/v1/tasks/scripts/cryptoLiveUpdates");
require("../services/v1/tasks/scripts/livecurrencies");
require("../services/v1/tasks/wallet/bankWithdrawals.worker");
const socket_io_1 = require("socket.io");
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
const wallet_routes_1 = __importDefault(require("../routes/v1/wallet.routes"));
const banks_service_1 = require("../services/v1/wallet/banks.service");
const socketAuth_1 = require("../middlewares/socketAuth");
const socket_controller_1 = require("../controllers/v1/sockets/socket.controller");
const notifications_routes_1 = __importDefault(require("../routes/v1/notifications.routes"));
require("../services/v1/jobs/payment-verification/paymentVerificationWorker");
const checkredis_1 = require("../middlewares/checkredis");
const timeoutAutoComplete_1 = require("../services/v1/jobs/payment-verification/timeoutAutoComplete");
const metaTx_1 = require("../crypto-transfers/services/metaTx");
const port_sanitation_1 = require("./port-sanitation");
(0, dotenv_1.config)();
(0, dotenv_1.config)({ path: `.env` });
// Create an Express application
const PORT = process.env.CRYGOCA_MAIN_SERVER_PORT;
const SERVER_URL = "0.0.0.0";
const server = http_1.default.createServer(_app_1.default);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
    },
});
io.use(socketAuth_1.socketAuth);
const wrap = (middleware) => (socket, next) => {
    middleware(socket.request, {}, next);
};
io.use(wrap(session_1.sessionMiddleware));
_app_1.default.set("io", io);
(0, socket_controller_1.setupSocketHandlers)(io);
if (process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "prod") {
    _app_1.default.use((0, cors_1.default)({
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
            "https://uatmarketplace.crygoca.com",
        ], // Array of allowed origins // Explicitly specify the allowed origin
        credentials: true, // Allow cookies and credentials to be sent
    }));
}
// Configure body-parser or express.json() with a higher limit
_app_1.default.use(express_1.default.json({ limit: "10mb" })); // Increase to 10MB or adjust as needed
_app_1.default.use(express_1.default.urlencoded({ limit: "10mb", extended: true }));
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
_app_1.default.use(checkredis_1.checkRedis);
_app_1.default.get("/", async (req, res) => {
    (0, timeoutAutoComplete_1.timeoutAutoConfirmation)();
    res.send("Crygoca Backend says hello!");
});
_app_1.default.get("/ip", async (req, res) => {
    const result = await (0, comparison_service_1.getUserCountry)(req);
    res.send({
        status: true,
        data: result,
    });
});
const MOONPAY_WEBHOOK_SECRET = process.env.MOONPAY_WEBHOOK_SECRET;
_app_1.default.post("/webhook/moonpay", (req, res) => {
    const signature = req.headers["moonpay-signature"];
    // const payload = JSON.stringify(req.body);
    // const expectedSignature = crypto
    //   .createHmac('sha256', MOONPAY_WEBHOOK_SECRET)
    //   .update(payload)
    //   .digest('hex');
    // if (signature !== expectedSignature) {
    //   return res.status(400).send('Invalid signature');
    // }
    const event = req.body;
    res.sendStatus(200);
});
_app_1.default.post("/save-banks", async (req, res) => {
    const countryCode = req.body.countryCode;
    const banks = req.body.banks;
    const result = await (0, banks_service_1.saveBanksForCountry)(banks, countryCode);
    res.send({
        status: true,
        data: result,
    });
});
// Login route
_app_1.default.post("/auth/google", jwt_1.verifyGoogleToken, async (req, res) => {
    req.gAccount = req.user; // Save user in session
    if (req.query?.referralCode?.trim() !== "" &&
        req.query?.referralCode?.trim() !== null) {
        req.referralCode = req.query.referralCode;
    }
    const result = await authentication_social_service_1.SocialAuthentication.googleAuthentication(req);
    res.status(200).send(result); // Return user data to frontend
});
_app_1.default.get("/auth/google/callback", passport_auth_1.default.authenticate("google", { failureRedirect: "/" }), async (req, res) => {
    res.redirect(`${process.env
        .CRYGOCA_SERVER_URL}/auth/success?user=${encodeURIComponent(JSON.stringify(req.g_user))}`);
});
_app_1.default.get("/auth/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});
_app_1.default.get("/profile", (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(req.user);
});
_app_1.default.get("/setup-relayer", async (req, res) => {
    const relayer = await (0, metaTx_1.setUpRelayer)();
    return res.json(relayer);
});
_app_1.default.post("/api/v1/contact", enquiries_service_1.enquiriesService);
_app_1.default.use("/api/v1/auth", authentication_route_1.default);
_app_1.default.use("/api/v1", compare_routes_1.default);
_app_1.default.use("/api/v1", liveCurrencies_routes_1.default);
_app_1.default.use("/api/v1", cryptoCurrencies_route_1.default);
_app_1.default.use("/api/v1", flutterwave_route_1.default);
_app_1.default.use("/api/v1", checkout_routes_1.default);
_app_1.default.use("/api/v1", orders_routes_1.default);
_app_1.default.use("/api/v1", dashboard_routes_1.default);
_app_1.default.use("/api/v1", payouts_route_1.default);
_app_1.default.use("/api/v1/profile", profile_routes_1.default);
_app_1.default.use("/api/v1/wallet", wallet_routes_1.default);
_app_1.default.use("/api/v1/notifications", notifications_routes_1.default);
_app_1.default.use(express_1.default.static("public"));
const staticFolder = process.env.PUBLIC_FOLDER;
const oneYearInMilliseconds = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
_app_1.default.use(express_1.default.static(staticFolder, {
    maxAge: oneYearInMilliseconds, // Cache for 1 Year
    setHeaders: (res, path) => {
        res.setHeader("Cache-Control", `public, max-age=${oneYearInMilliseconds}`);
    },
}));
_app_1.default.use(express_1.default.static(process.env.PUBLIC_FOLDER_2));
_app_1.default.set("view engine", "ejs");
_app_1.default.set("views", "src/templates");
function generateAsciiArt(text, env) {
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
//Sanitize port
(0, port_sanitation_1.killPortProcess)(Number(PORT));
// Start the server
server.listen(PORT, () => {
    let env = "Development";
    if (process.env.NODE_ENV === "prod") {
        env = "Production";
    }
    const serverMessage = generateAsciiArt(`Crygoca ${env} Server is running on ${SERVER_URL}:${PORT}`.toUpperCase(), env);
    console.log(serverMessage);
});
