// secrets.js
const fs = require("fs");
const MCrypto = require("crypto");

export class SecretsManager {
  #secrets:any = {};

  constructor(password: string) {
    this.#secrets = this.#decryptEnv(password);
    this.#proxyProcessEnv();
  }

  #decryptEnv(password: any) {
    const algorithm = "aes-256-cbc";
    const ivLength = 16;

    const encrypted = fs.readFileSync(".env.enc");
    const iv = encrypted.slice(0, ivLength);
    const encryptedText = encrypted.slice(ivLength);

    const key = MCrypto.createHash("sha256").update(password).digest();
    const decipher = MCrypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText, undefined, "utf8");
    decrypted += decipher.final("utf8");

    const envObj:any = {};
    decrypted.split("\n").forEach((line: { trim: () => any; split: (arg0: string) => [any, ...any[]]; }) => {
      if (!line.trim()) return;
      const [k, ...v] = line.split("=");
      envObj[k.trim()] = v.join("=").trim();
    });

    return envObj;
  }

  get(key: string | number) {
    return this.#secrets[key];
  }

  #proxyProcessEnv() {
    const proxy:any = new Proxy(process.env, {
      get: (target, prop) => {
        const _prop:any = prop;
        if (typeof _prop === "string" && this.#secrets[_prop]) {
          return this.#secrets[_prop];
        }
        return target[_prop];
      },
    });

    global.process.env = proxy;
  }
}



// {
//   "_id": {
//     "$oid": "6842ff2d3a280dfe916355ef"
//   },
//   "account": {
//     "$oid": "6842ff2b3a280dfe916355ea"
//   },
//   "chainId": 1,
//   "address": "0x5c32dc04ec965f8fc0253261b018d9f1af4f6b24",
//   "privateKey": "b519f6ffb16e01322b0d830d07fc5c36:2494dfb84e19e8854f9d7fc9ee89b9ab9499d1ef5bcfc579898523154bb2f8cfaa1b243b441514fac6ca6867328cba516948e2310716d67f9233aa57d8968914a5de:f00ac1f2737bf95fe0ba7aff52c7fbe8",
//   "nonce": 0,
//   "isRelayer": false,
//   "createdAt": {
//     "$date": "2025-06-06T14:46:05.377Z"
//   },
//   "updatedAt": {
//     "$date": "2025-06-06T14:46:05.377Z"
//   },
//   "__v": 0
// }