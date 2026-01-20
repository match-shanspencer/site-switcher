import { readSystemHostsFile } from '../core/hosts-manager';
import * as logger from '../utils/logger';

export const execute = async (): Promise<void> => {
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
};
