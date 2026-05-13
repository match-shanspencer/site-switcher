import { loadConfig } from "../core/config-manager";
import { fetchRemoteHosts } from "../core/remote-fetcher";
import * as logger from "../utils/logger";

export const execute = async (args: string[]): Promise<void> => {
  const config = await loadConfig();
  const name = args[0];

  if (name) {
    const url = config.remoteHostsUris[name];

    if (!url) {
      logger.error(`Remote hosts configuration '${name}' not found`);
      logger.info(`Available: ${Object.keys(config.remoteHostsUris).join(", ")}`);
      process.exit(1);
    }

    logger.info(`Fetching ${name} from ${url}...`);

    try {
      await fetchRemoteHosts(name, url);
      logger.success(`Fetched and cached ${name}`);
    } catch (error) {
      logger.error(`Failed to fetch ${name}: ${(error as Error).message}`);
      process.exit(1);
    }
  } else {
    logger.info(`Fetching all remote hosts configurations...`);

    const results = await Promise.allSettled(
      Object.entries(config.remoteHostsUris).map(async ([name, url]) => {
        await fetchRemoteHosts(name, url);
        return name;
      }),
    );

    let successCount = 0;
    let failureCount = 0;

    for (const result of results) {
      if (result.status === "fulfilled") {
        logger.success(`Fetched ${result.value}`);
        successCount++;
      } else {
        logger.error(`Failed to fetch: ${result.reason.message}`);
        failureCount++;
      }
    }

    logger.log("");
    logger.info(`Fetched ${successCount} of ${results.length} configurations`);

    if (failureCount > 0) {
      process.exit(1);
    }
  }
};
