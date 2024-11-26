import express, { Request, Response } from "express";
import http from "http";
import cors from "cors";
import "./init.mongo";
import compareRoute from "./routes/v1/compare.routes";
import liveRates from "./routes/v1/liveCurrencies.routes";
import authRouter from "./routes/v1/authentication.route";
import { config as dotenvConfig } from "dotenv";
import { getUserCountry } from "./services/v1/comparison.service";
import "./services/v1/task.service";
import { enquiriesService } from "./services/v1/enquiries.service";
import liveCrypto from "./routes/v1/cryptoCurrencies.route";
import { createHash } from "crypto";
dotenvConfig();
dotenvConfig({path:`.env.prod`});
// Create an Express application
const app = express();
const PORT = 8000;
const SERVER_URL = "0.0.0.0";

const server = http.createServer(app);
app.use(
  cors({
    origin: "*",
  })
);
app.set("trust proxy", true);
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Crygoca Backend says hello!");
});


app.get("/ip", async (req, res) => {
  const result = await getUserCountry(req);
  res.send({
    status: true,
    data: result,
  });
});

app.post("/api/v1/contact", enquiriesService);

app.use("/api/v1", compareRoute);
app.use("/api/v1", liveRates);
app.use("/api/v1", liveCrypto);

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
const staticFolder = process.env.PUBLIC_FOLDER! as string
const oneYearInMilliseconds = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds

app.use(express.static(staticFolder, {
  maxAge: oneYearInMilliseconds, // Cache for 1 Year
  setHeaders: (res, path) => {
    res.setHeader('Cache-Control', `public, max-age=${oneYearInMilliseconds}`); // 1 Year in seconds
  }
}));


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
function generateHash(
  merchantId: string,
  serviceTypeId: string,
  requestId: string,
  amount: string,
  apiKey: string
) {
  const concatenatedString = `${merchantId}${serviceTypeId}${requestId}${amount}${apiKey}`;
  const hash = createHash("sha512");
  hash.update(concatenatedString);
  return hash.digest("hex");
}

function test() {
  const merchantId = "27768931";
  const serviceTypeId = "35126630";
  const amount = "1000";
  const apiKey = "Q1dHREVNTzEyMzR8Q1dHREVNTw==";

  const requestId = generateRequestId();
  const hashValue = generateHash(
    merchantId,
    serviceTypeId,
    requestId,
    amount,
    apiKey
  );

  console.log("Generated Request ID:", requestId);
  console.log("Generated Hash:", hashValue);
}
// Start the server
server.listen(PORT, () => {
  test();
  const serverMessage = generateAsciiArt(
    `Crygoca Development Server is running on ${SERVER_URL}:${PORT}`.toUpperCase()
  );
  console.log(serverMessage);
});
