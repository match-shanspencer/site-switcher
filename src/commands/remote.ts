import { loadConfig, getRemoteHostUrl } from "../core/config-manager";
import { fetchRemoteHosts, getCachedHosts, getRemoteHostInfo } from "../core/remote-fetcher";
import { applyHostsFile, setActiveHostsName } from "../core/hosts-manager";
import * as logger from "../utils/logger";
import { formatTimestamp } from "../utils/format";

export const execute = async (args: string[]): Promise<void> => {
  const subcommand = args[0];

  if (subcommand === "fetch") {
    const config = await loadConfig();
    const name = args[1];

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
  } else if (["list", "show"].includes(subcommand)) {
    const config = await loadConfig();

    const hostInfos = await Promise.all(
      Object.entries(config.remoteHostsUris).map(([name, url]) => getRemoteHostInfo(name, url)),
    );

    logger.heading("Remote Hosts Configuration");
    logger.log("");

    const headers = ["Name", "Last Fetched", "Status", "URL"];
    const rows = hostInfos.map((info) => [
      info.name,
      formatTimestamp(info.lastFetched),
      info.cached ? "Cached" : "Not fetched",
      info.url,
    ]);

    logger.table(headers, rows);
  } else if (["set", "use"].includes(subcommand)) {
    const name = args[1];

    if (!name) {
      logger.error("Please specify a remote hosts configuration name");
      logger.info("Usage: siteswitcher remote set <name>");
      process.exit(1);
    }

    const config = await loadConfig();
    const url = await getRemoteHostUrl(name);

    if (!url) {
      logger.error(`Remote hosts configuration '${name}' not found`);
      logger.info(`Available: ${Object.keys(config.remoteHostsUris).join(", ")}`);
      process.exit(1);
    }

    let remoteHostsContent = await getCachedHosts(name);

    if (!remoteHostsContent) {
      logger.info(`Remote hosts '${name}' not cached or expired, fetching from remote...`);
      try {
        remoteHostsContent = await fetchRemoteHosts(name, url);
      } catch (error) {
        logger.error(`Failed to fetch remote hosts '${name}': ${(error as Error).message}`);
        process.exit(1);
      }
    }

    logger.info(`Applying remote hosts file (without local overrides)...`);

    try {
      await applyHostsFile(remoteHostsContent);
      await setActiveHostsName(name);

      logger.success(`Applied remote hosts configuration: ${name} (without local overrides)`);
    } catch (error) {
      logger.error(`Failed to apply hosts file: ${(error as Error).message}`);
      process.exit(1);
    }
  } else {
    logger.error("Invalid subcommand. Use: remote fetch [name], remote list, or remote set <name>");
    process.exit(1);
  }
};
