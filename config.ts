import fs from "fs";
import path from "path";
import logger from "./src/bootstrap/logger";

let configPath = "C:\\Users\\emmanuel\\Documents\\Workspace\\NEWCRYGOKA\\be.crygoca\\config.json"

/**
 * Reads the current configuration from the JSON file.
 */
export function getTestConfig(): any {
  try {
    logger.info(`Getting configPath ${configPath}`)
    const data = fs.readFileSync(configPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading config file:", error);
    return {};
  }
}

/**
 * Updates a specific key in the config file and persists it.
 * @param key - The config key to update.
 * @param value - The new value.
 */
export function updateTestConfig(key: string, value: any): void {
  const config = getTestConfig();
  config[key] = value;

  try {
    logger.info(`Getting configPath ${configPath}`)
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf8");
  } catch (error) {
    console.error("Error updating config file:", error);
  }
}
