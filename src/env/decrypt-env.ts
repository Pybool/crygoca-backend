import readline from "readline";
import * as fs from 'fs';
import { SecretsManager } from "../../secrets-manager";

/**
 * Prompt the user for a password with no output shown while typing.
 */
export async function promptForPassword(): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    }) as readline.Interface & {
      output: NodeJS.WritableStream;
      stdoutMuted?: boolean;
      _writeToOutput?: (str: string) => void;
    };

   

    rl.stdoutMuted = true;
    rl.question("🔐 Enter decryption password: ", (password: string) => {
      rl.output.write("\n");
      rl.close();
      resolve(password);
    });
    
  });
}

export async function setUpSecrets() {
  let password = ""
  console.log("process.env.NODE_ENV ", process.env.NODE_ENV)
  if (process.env.NODE_ENV == "prod") {
    password = fs
      .readFileSync("/run/secrets/decryption_password", "utf8")
      .trim();
  }else{
    password = await promptForPassword();
  }

  new SecretsManager(password);
  console.log("✅ Secrets decrypted.");
}

