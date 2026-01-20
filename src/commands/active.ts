import { getActiveHostsName } from '../core/hosts-manager';
import * as logger from '../utils/logger';

export const execute = async (): Promise<void> => {
  const activeName = await getActiveHostsName();

  if (activeName) {
    logger.info(`Currently active hosts configuration: ${activeName}`);
  } else {
    logger.info('No hosts configuration is currently active');
  }
};
