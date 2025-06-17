"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUpSecrets = exports.promptForPassword = void 0;
const readline_1 = __importDefault(require("readline"));
const fs = __importStar(require("fs"));
const secrets_manager_1 = require("../../secrets-manager");
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
    });
}
exports.promptForPassword = promptForPassword;
async function setUpSecrets() {
    let password = "";
    console.log("process.env.NODE_ENV ", process.env.NODE_ENV);
    if (process.env.NODE_ENV == "prod") {
        password = fs
            .readFileSync("/run/secrets/decryption_password", "utf8")
            .trim();
    }
    else {
        password = await promptForPassword();
    }
    new secrets_manager_1.SecretsManager(password);
    console.log("✅ Secrets decrypted.");
}
exports.setUpSecrets = setUpSecrets;
