import { loadConfig, getRemoteHostUrl } from '../core/config-manager';
import { fetchRemoteHosts, getCachedHosts } from '../core/remote-fetcher';
import { readOverridesFile, applyHostsFile, setActiveHostsName } from '../core/hosts-manager';
import { mergeHostsFiles } from '../core/merger';
import * as logger from '../utils/logger';

export const execute = async (args: string[]): Promise<void> => {
  const name = args[0];

  if (!name) {
    logger.error('Please specify a remote hosts configuration name');
    logger.info('Usage: siteswitcher hosts set <name>');
    process.exit(1);
  }

  const config = await loadConfig();
  const url = await getRemoteHostUrl(name);

  if (!url) {
    logger.error(`Remote hosts configuration '${name}' not found`);
    logger.info(`Available: ${Object.keys(config.remoteHostsUris).join(', ')}`);
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
    logger.info(`Overrides: ${mergeResult.overrideCount}, Commented: ${mergeResult.commentedCount}`);
  } catch (error) {
    logger.error(`Failed to apply hosts file: ${(error as Error).message}`);
    process.exit(1);
  }
};
