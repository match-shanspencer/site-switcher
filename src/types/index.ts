export interface Config {
  version: string;
  editor: string | null;
  hostsPath: string;
  remoteHostsUris: Record<string, string>;
}

export interface CacheMetadata {
  lastFetched: number;
  url: string;
}

export interface HostsEntry {
  ip: string;
  hostnames: string[];
  comment?: string;
}

export interface ParsedHostsFile {
  entries: HostsEntry[];
  comments: string[];
}

export interface RemoteHostInfo {
  name: string;
  url: string;
  lastFetched: number | null;
  cached: boolean;
}

export type Platform = 'darwin' | 'linux' | 'win32';

export interface MergeResult {
  content: string;
  overrideCount: number;
  commentedCount: number;
}
