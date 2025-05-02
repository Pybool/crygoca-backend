"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTestConfig = exports.getTestConfig = void 0;
const fs_1 = __importDefault(require("fs"));
const logger_1 = __importDefault(require("./src/bootstrap/logger"));
let configPath = "C:\\Users\\emmanuel\\Documents\\Workspace\\NEWCRYGOKA\\be.crygoca\\config.json";
/**
 * Reads the current configuration from the JSON file.
 */
function getTestConfig() {
    try {
        logger_1.default.info(`Getting configPath ${configPath}`);
        const data = fs_1.default.readFileSync(configPath, "utf8");
        return JSON.parse(data);
    }
    catch (error) {
        console.error("Error reading config file:", error);
        return {};
    }
}
exports.getTestConfig = getTestConfig;
/**
 * Updates a specific key in the config file and persists it.
 * @param key - The config key to update.
 * @param value - The new value.
 */
function updateTestConfig(key, value) {
    const config = getTestConfig();
    config[key] = value;
    try {
        logger_1.default.info(`Getting configPath ${configPath}`);
        fs_1.default.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
    }
    catch (error) {
        console.error("Error updating config file:", error);
    }
}
exports.updateTestConfig = updateTestConfig;
