import { loadConfig, getRemoteHostUrl } from "../core/config-manager";
import { fetchRemoteHosts, getCachedHosts } from "../core/remote-fetcher";
import {
  ensureOverridesFileExists,
  readOverridesFile,
  applyHostsFile,
  setActiveHostsName,
} from "../core/hosts-manager";
import { getOverridesPath } from "../utils/platform";
import { openInEditor } from "../utils/editor";
import { mergeHostsFiles } from "../core/merger";
import * as logger from "../utils/logger";

export const execute = async (args: string[]): Promise<void> => {
  const subcommand = args[0];

  if (["edit", "open"].includes(subcommand)) {
    await ensureOverridesFileExists();

    const overridesPath = getOverridesPath();

    logger.info(`Opening local hosts file: ${overridesPath}`);

    try {
      await openInEditor(overridesPath);
      logger.success("Local hosts file updated");
    } catch (error) {
      logger.error(`Failed to open editor: ${(error as Error).message}`);
      process.exit(1);
    }
  } else if (["set", "use"].includes(subcommand)) {
    const name = args[1];

    if (!name) {
      logger.error("Please specify a remote hosts configuration name");
      logger.info("Usage: siteswitcher local set <name>");
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

    logger.info(`Loading overrides...`);
    const overridesContent = await readOverridesFile();

    logger.info(`Merging hosts files...`);
    const mergeResult = mergeHostsFiles(remoteHostsContent, overridesContent, name);

    logger.info(`Applying merged hosts file (requires sudo)...`);

    try {
      await applyHostsFile(mergeResult.content);
      await setActiveHostsName(name);

      logger.success(`Applied hosts configuration: ${name}`);
      logger.info(
        `Overrides: ${mergeResult.overrideCount}, Commented: ${mergeResult.commentedCount}`,
      );
    } catch (error) {
      logger.error(`Failed to apply hosts file: ${(error as Error).message}`);
      process.exit(1);
    }
  } else if (["show", "list"].includes(subcommand)) {
    try {
      const content = await readOverridesFile();
      const lines = content.split("\n");

      const GRAY = "\x1b[90m";
      const RESET = "\x1b[0m";

      lines.forEach((line, index) => {
        const lineNumber = (index + 1).toString().padStart(4, " ");
        console.log(`${GRAY}${lineNumber} │${RESET} ${line}`);
      });
    } catch (error) {
      logger.error(`Failed to read hosts file: ${(error as Error).message}`);
      process.exit(1);
    }
  } else {
    logger.error("Invalid subcommand. Use: local edit, local list or local set <name>");
    process.exit(1);
  }
};
