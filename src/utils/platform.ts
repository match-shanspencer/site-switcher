import { homedir } from 'os';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import type { Platform } from '../types';

export const getPlatform = (): Platform => {
  const platform = process.platform;
  if (platform === 'darwin' || platform === 'linux' || platform === 'win32') {
    return platform;
  }
  throw new Error(`Unsupported platform: ${platform}`);
};

export const getDefaultHostsPath = (): string => {
  const platform = getPlatform();

  switch (platform) {
    case 'darwin':
    case 'linux':
      return '/etc/hosts';
    case 'win32':
      return 'C:\\Windows\\System32\\drivers\\etc\\hosts';
  }
};

export const getHomeDirectory = (): string => {
  return homedir();
};

export const getAppDirectory = (): string => {
  return join(getHomeDirectory(), '.siteswitcher');
};

export const getCacheDirectory = (): string => {
  return join(getAppDirectory(), 'cache');
};

export const getTempDirectory = (): string => {
  return join(getAppDirectory(), 'temp');
};

export const getConfigPath = (): string => {
  return join(getAppDirectory(), 'config.json');
};

export const getBuildTimeConfigPath = (): string | null => {
  // Try to find config.local.json relative to the executable
  // This allows build-time defaults to be included with the binary
  try {
    // For compiled binaries, check next to the executable
    // For development, check in the project root
    const execPath = process.execPath;
    let execDir: string;


    if (execPath.includes('bun') || execPath.includes('node')) {
      // Development mode - check project root
      execDir = process.cwd();
    } else {
      // Compiled binary - check next to executable
      execDir = dirname(execPath);
    }

    // Check next to executable/binary
    const localConfigPath = join(execDir, 'config.local.json');
    if (existsSync(localConfigPath)) {
      return localConfigPath;
    }

    // Also check in a config subdirectory
    const configDirPath = join(execDir, 'config', 'config.local.json');
    if (existsSync(configDirPath)) {
      return configDirPath;
    }
  } catch {
    // Ignore errors - build-time config is optional
  }

  return null;
};

export const getOverridesPath = (): string => {
  return join(getAppDirectory(), 'overrides.hosts');
};

export const getActivePath = (): string => {
  return join(getAppDirectory(), 'active.txt');
};

export const getCachePath = (name: string): string => {
  return join(getCacheDirectory(), `${name}.hosts`);
};

export const getCacheMetadataPath = (name: string): string => {
  return join(getCacheDirectory(), `${name}.meta.json`);
};

export const getTempMergedPath = (): string => {
  return join(getTempDirectory(), 'merged.hosts');
};
