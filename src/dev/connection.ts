import { config as dotenvConfig } from "dotenv";
const { RedisConnection } = require("bullmq");

dotenvConfig();
dotenvConfig({path:`.env`});

export const connection = new RedisConnection({
  host: process.env.CRYGOCA_REDIS_HOST,
  port: parseInt(process.env.CRYGOCA_REDIS_GENERIC_PORT as string),
  password: process.env.REDIS_PASSWORD
});


