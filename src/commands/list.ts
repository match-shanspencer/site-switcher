import { loadConfig } from '../core/config-manager';
import { getRemoteHostInfo } from '../core/remote-fetcher';
import * as logger from '../utils/logger';
import { formatTimestamp } from '../utils/format';

export const execute = async (): Promise<void> => {
  const config = await loadConfig();

  const hostInfos = await Promise.all(
    Object.entries(config.remoteHostsUris).map(([name, url]) =>
      getRemoteHostInfo(name, url)
    )
  );

  logger.heading('Remote Hosts Configuration');
  logger.log('');

  const headers = ['Name', 'Last Fetched', 'Status', 'URL'];
  const rows = hostInfos.map(info => [
    info.name,
    formatTimestamp(info.lastFetched),
    info.cached ? 'Cached' : 'Not fetched',
    info.url,
  ]);

  logger.table(headers, rows);
};
