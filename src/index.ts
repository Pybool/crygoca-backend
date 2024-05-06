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
dotenvConfig();
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

app.use("/api/v1", compareRoute);
app.use("/api/v1", liveRates);

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

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
