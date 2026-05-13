import { readSystemHostsFile, applyHostsFile, clearActiveHostsName } from '../core/hosts-manager';
import { loadConfig } from '../core/config-manager';
import { openInEditor } from '../utils/editor';
import * as logger from '../utils/logger';

const DEFAULT_HOSTS_CONTENT = `127.0.0.1		localhost
255.255.255.255	broadcasthost
::1				localhost
fe80::1%lo0		localhost`;

export const execute = async (args: string[]): Promise<void> => {
  const subcommand = args[0];

  if (['show', 'list'].includes(subcommand)) {
    try {
      const content = await readSystemHostsFile();
      const lines = content.split('\n');

      const GRAY = '\x1b[90m';
      const RESET = '\x1b[0m';

      lines.forEach((line, index) => {
        const lineNumber = (index + 1).toString().padStart(4, ' ');
        console.log(`${GRAY}${lineNumber} │${RESET} ${line}`);
      });
    } catch (error) {
      logger.error(`Failed to read hosts file: ${(error as Error).message}`);
      process.exit(1);
    }
  } else if (['open', 'edit'].includes(subcommand)) {
    const config = await loadConfig();

    logger.info(`Opening system hosts file: ${config.hostsPath}`);
    logger.warn('Note: You may need sudo privileges to save changes');

    try {
      await openInEditor(config.hostsPath);
    } catch (error) {
      logger.error(`Failed to open editor: ${(error as Error).message}`);
      process.exit(1);
    }
  } else if (subcommand === 'restore') {
    try {
      logger.info(`Restoring system hosts file to defaults...`);

      await applyHostsFile(DEFAULT_HOSTS_CONTENT);
      await clearActiveHostsName();

      logger.success('System hosts file restored to defaults');
    } catch (error) {
      logger.error(`Failed to restore hosts file: ${(error as Error).message}`);
      process.exit(1);
    }
  } else {
    logger.error('Invalid subcommand. Use: system list, system open, or system restore');
    process.exit(1);
  }
};
