import { getConfigPath } from "../utils/platform";
import { openInEditor } from "../utils/editor";
import { loadConfig, setConfigValue, restoreConfigToDefaults } from "../core/config-manager";
import * as logger from "../utils/logger";

export const execute = async (args: string[]): Promise<void> => {
  const subcommand = args[0];

  if (subcommand === "list") {
    const config = await loadConfig();
    const jsonOutput = JSON.stringify(config, null, 2);
    logger.log(jsonOutput);
  } else if (subcommand === "open") {
    const configPath = getConfigPath();
    logger.info(`Opening config file: ${configPath}`);

    try {
      await openInEditor(configPath);
      logger.success("Config file updated");
    } catch (error) {
      logger.error(`Failed to open editor: ${(error as Error).message}`);
      process.exit(1);
    }
  } else if (subcommand === "set") {
    const keyValue = args[1];

    if (!keyValue || !keyValue.includes("=")) {
      logger.error("Invalid format. Use: config set key=value");
      process.exit(1);
    }

    const [key, ...valueParts] = keyValue.split("=");
    const value = valueParts.join("=");

    try {
      await setConfigValue(key, value);
      logger.success(`Set ${key} = ${value}`);
    } catch (error) {
      logger.error(`Failed to set config: ${(error as Error).message}`);
      process.exit(1);
    }
  } else if (subcommand === "restore") {
    try {
      await restoreConfigToDefaults();
      logger.success("Configuration restored to defaults");
    } catch (error) {
      logger.error(`Failed to restore config: ${(error as Error).message}`);
      process.exit(1);
    }
  } else {
    logger.error(
      "Invalid subcommand. Use: config list, config open, config set key=value, or config restore",
    );
    process.exit(1);
  }
};
