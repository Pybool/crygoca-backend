import { randomBytes } from "crypto";

export function generateKeys(type: "public" | "secret", mode: "test" | "live") {
  const prefix = type === "public"
    ? `CRY-PUB-${mode.toUpperCase()}-`
    : `CRY-SEC-${mode.toUpperCase()}-`;

  const randomPart = randomBytes(16).toString("hex").toUpperCase(); // 32 chars
  return prefix + randomPart;
}
