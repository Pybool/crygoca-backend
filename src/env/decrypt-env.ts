import readline from "readline";
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

     

    // rl._writeToOutput = function (stringToWrite) {
    //   if (rl.stdoutMuted) rl.output.write("*");
    //   else rl.output.write(stringToWrite);
    // };
    
  });
}

export async function setUpSecrets() {
  const password = await promptForPassword();
  new SecretsManager(password);
  console.log("✅ Secrets decrypted.");
}
