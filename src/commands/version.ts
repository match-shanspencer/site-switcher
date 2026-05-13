import * as logger from "../utils/logger";
import packageJson from "../../package.json";

export const execute = async (): Promise<void> => {
  logger.heading("SiteSwitcher");
  logger.log(`Version: ${packageJson.version}`);
};
