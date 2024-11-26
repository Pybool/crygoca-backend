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
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
require("./init.mongo");
const compare_routes_1 = __importDefault(require("./routes/v1/compare.routes"));
const liveCurrencies_routes_1 = __importDefault(require("./routes/v1/liveCurrencies.routes"));
const authentication_route_1 = __importDefault(require("./routes/v1/authentication.route"));
const dotenv_1 = require("dotenv");
const comparison_service_1 = require("./services/v1/comparison.service");
require("./services/v1/task.service");
const enquiries_service_1 = require("./services/v1/enquiries.service");
const cryptoCurrencies_route_1 = __importDefault(require("./routes/v1/cryptoCurrencies.route"));
const crypto_1 = require("crypto");
(0, dotenv_1.config)();
(0, dotenv_1.config)({ path: `.env.prod` });
// Create an Express application
const app = (0, express_1.default)();
const PORT = 8000;
const SERVER_URL = "0.0.0.0";
const server = http_1.default.createServer(app);
app.use((0, cors_1.default)({
    origin: "*",
}));
app.set("trust proxy", true);
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.send("Crygoca Backend says hello!");
});
app.get("/ip", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield (0, comparison_service_1.getUserCountry)(req);
    res.send({
        status: true,
        data: result,
    });
}));
app.post("/api/v1/contact", enquiries_service_1.enquiriesService);
app.use("/api/v1", compare_routes_1.default);
app.use("/api/v1", liveCurrencies_routes_1.default);
app.use("/api/v1", cryptoCurrencies_route_1.default);
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static("public"));
const staticFolder = process.env.PUBLIC_FOLDER;
const oneYearInMilliseconds = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
app.use(express_1.default.static(staticFolder, {
    maxAge: oneYearInMilliseconds, // Cache for 1 Year
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', `public, max-age=${oneYearInMilliseconds}`); // 1 Year in seconds
    }
}));
app.use("/api/v1/auth", authentication_route_1.default);
app.set("view engine", "ejs");
app.set("views", "src/templates");
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
// Function to generate requestId
function generateRequestId() {
    let countGenerated = 0;
    let generatedRequestId = "";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    while (countGenerated < 15) {
        countGenerated++;
        const requestId = chars.charAt(Math.floor(Math.random() * chars.length));
        generatedRequestId += requestId;
    }
    return generatedRequestId;
}
// Function to generate hash
function generateHash(merchantId, serviceTypeId, requestId, amount, apiKey) {
    const concatenatedString = `${merchantId}${serviceTypeId}${requestId}${amount}${apiKey}`;
    const hash = (0, crypto_1.createHash)("sha512");
    hash.update(concatenatedString);
    return hash.digest("hex");
}
function test() {
    const merchantId = "27768931";
    const serviceTypeId = "35126630";
    const amount = "1000";
    const apiKey = "Q1dHREVNTzEyMzR8Q1dHREVNTw==";
    const requestId = generateRequestId();
    const hashValue = generateHash(merchantId, serviceTypeId, requestId, amount, apiKey);
    console.log("Generated Request ID:", requestId);
    console.log("Generated Hash:", hashValue);
}
// Start the server
server.listen(PORT, () => {
    test();
    const serverMessage = generateAsciiArt(`Crygoca Development Server is running on ${SERVER_URL}:${PORT}`.toUpperCase());
    console.log(serverMessage);
});
