"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUpSecrets = exports.promptForPassword = void 0;
const readline_1 = __importDefault(require("readline"));
const secrets_manager_1 = require("../secrets-manager");
/**
 * Prompt the user for a password with no output shown while typing.
 */
async function promptForPassword() {
    return new Promise((resolve) => {
        const rl = readline_1.default.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true,
        });
        rl.stdoutMuted = true;
        rl.question("🔐 Enter decryption password: ", (password) => {
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
exports.promptForPassword = promptForPassword;
async function setUpSecrets() {
    const password = await promptForPassword();
    new secrets_manager_1.SecretsManager(password);
    console.log("✅ Secrets decrypted.");
}
exports.setUpSecrets = setUpSecrets;
