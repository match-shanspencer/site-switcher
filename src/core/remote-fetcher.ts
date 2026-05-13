import type { CacheMetadata, RemoteHostInfo } from "../types";
import { getCachePath, getCacheMetadataPath, getCacheDirectory } from "../utils/platform";
import {
  readFileIfExists,
  writeFileAtomic,
  writeJsonFile,
  readJsonFile,
  ensureDirectoryExists,
} from "../utils/file-system";

export const fetchRemoteHosts = async (name: string, url: string): Promise<string> => {
  await ensureDirectoryExists(getCacheDirectory());

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${name}: ${response.status} ${response.statusText}`);
  }

  const content = await response.text();

  const cachePath = getCachePath(name);
  await writeFileAtomic(cachePath, content);

  const metadata: CacheMetadata = {
    lastFetched: Date.now(),
    url,
  };

  const metadataPath = getCacheMetadataPath(name);
  await writeJsonFile(metadataPath, metadata);

  return content;
};

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export const getCachedHosts = async (name: string): Promise<string | null> => {
  const cachePath = getCachePath(name);
  const cachedContent = await readFileIfExists(cachePath);

  if (!cachedContent) {
    return null;
  }

  const metadata = await getCacheMetadata(name);
  if (!metadata) {
    return null;
  }

  const age = Date.now() - metadata.lastFetched;
  if (age >= CACHE_TTL_MS) {
    return null; // Cache expired
  }

  return cachedContent;
};

export const getCacheMetadata = async (name: string): Promise<CacheMetadata | null> => {
  const metadataPath = getCacheMetadataPath(name);
  return await readJsonFile<CacheMetadata>(metadataPath);
};

export const getRemoteHostInfo = async (name: string, url: string): Promise<RemoteHostInfo> => {
  const metadata = await getCacheMetadata(name);

  return {
    name,
    url,
    lastFetched: metadata?.lastFetched || null,
    cached: metadata !== null,
  };
};
