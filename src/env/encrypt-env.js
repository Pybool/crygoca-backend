const fs = require("fs");
const crypto = require("crypto");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
rl.stdoutMuted = true;

const algorithm = "aes-256-cbc";
const ivLength = 16;

rl.question("🔐 Enter password to encrypt .env: ", (password) => {
  rl.close();

  try {
    const env = fs.readFileSync(".env.prod", "utf8");
    const iv = crypto.randomBytes(ivLength);
    const key = crypto.createHash("sha256").update(password).digest();

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(env, "utf8");
    encrypted = Buffer.concat([iv, encrypted, cipher.final()]);

    fs.writeFileSync(".env.enc", encrypted);
    console.log("✅ .env encrypted successfully");
  } catch (err) {
    console.error("❌ Encryption failed:", err.message);
  }
});

rl._writeToOutput = function (stringToWrite) {
  if (rl.stdoutMuted) rl.output.write("*");
  else rl.output.write(stringToWrite);
};
