import { ensureOverridesFileExists } from '../core/hosts-manager';
import { getOverridesPath } from '../utils/platform';
import { openInEditor } from '../utils/editor';
import * as logger from '../utils/logger';

export const execute = async (): Promise<void> => {
  await ensureOverridesFileExists();

  const overridesPath = getOverridesPath();

  logger.info(`Opening overrides file: ${overridesPath}`);

  try {
    await openInEditor(overridesPath);
    logger.success('Overrides file updated');
  } catch (error) {
    logger.error(`Failed to open editor: ${(error as Error).message}`);
    process.exit(1);
  }
};
