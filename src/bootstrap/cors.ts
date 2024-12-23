import cors, { CorsOptions } from "cors";
import logger from "./logger";

const CORS_OPTIONS: CorsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    const ALLOWED_CORS_ORIGINS: string = "localhost,127.0.0.1,http://localhost:4200,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001";

    const allowedOrigins = ALLOWED_CORS_ORIGINS.split(",");
    if (!origin || !allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // logger.info("Not allowed by CORS")
      callback(null, true);
      // callback(new Error("Not allowed by CORS"));
    }
  },
};

export default cors(CORS_OPTIONS);
