import { loadConfig } from '../core/config-manager';
import { openInEditor } from '../utils/editor';
import * as logger from '../utils/logger';

export const execute = async (): Promise<void> => {
  const config = await loadConfig();

  logger.info(`Opening system hosts file: ${config.hostsPath}`);
  logger.warn('Note: You may need sudo privileges to save changes');

  try {
    await openInEditor(config.hostsPath);
  } catch (error) {
    logger.error(`Failed to open editor: ${(error as Error).message}`);
    process.exit(1);
  }
};
