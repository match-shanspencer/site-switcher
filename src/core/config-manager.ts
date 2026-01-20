import type { Config } from '../types';
import { getConfigPath, getAppDirectory, getDefaultHostsPath, getBuildTimeConfigPath } from '../utils/platform';
import { readJsonFile, writeJsonFile, ensureDirectoryExists } from '../utils/file-system';
import { EMBEDDED_BUILD_TIME_CONFIG } from './build-time-config';

export const getDefaultConfig = (): Config => {
  return {
    version: '1.0',
    editor: null,
    hostsPath: getDefaultHostsPath(),
    remoteHostsUris: {},
  };
};

const mergeConfigs = (defaultConfig: Config, userConfig: Partial<Config>): Config => {
  return {
    ...defaultConfig,
    ...userConfig,
    remoteHostsUris: {
      ...defaultConfig.remoteHostsUris,
      ...(userConfig.remoteHostsUris || {}),
    },
  };
};

export const initializeConfig = async (): Promise<void> => {
  const appDir = getAppDirectory();
  await ensureDirectoryExists(appDir);

  const configPath = getConfigPath();
  const existingConfig = await readJsonFile<Partial<Config>>(configPath);

  // Only initialize if config doesn't exist at all
  // Don't overwrite existing user configs
  if (!existingConfig) {
    const defaultConfig = getDefaultConfig();
    await writeJsonFile(configPath, defaultConfig);
  }
};

export const loadConfig = async (): Promise<Config> => {
  await initializeConfig();

  const defaultConfig = getDefaultConfig();

  // Load build-time config
  // In development: prioritize file-based config (allows live editing)
  // In production: use embedded config (from binary)
  let buildTimeConfig: Partial<Config> | null = null;

  const buildTimeConfigPath = getBuildTimeConfigPath();
  const isDevelopment = process.execPath.includes('bun') || process.execPath.includes('node');

  if (isDevelopment && buildTimeConfigPath) {
    // Development mode: read from file (allows live changes)
    buildTimeConfig = await readJsonFile<Partial<Config>>(buildTimeConfigPath);
  } else {
    // Production mode: use embedded config (from binary)
    buildTimeConfig = EMBEDDED_BUILD_TIME_CONFIG;

    // Fallback: if no embedded config, try file-based (for backwards compatibility)
    if (!buildTimeConfig && buildTimeConfigPath) {
      buildTimeConfig = await readJsonFile<Partial<Config>>(buildTimeConfigPath);
    }
  }

  // Merge: default -> build-time -> user config
  let mergedConfig = defaultConfig;
  if (buildTimeConfig) {
    mergedConfig = mergeConfigs(mergedConfig, buildTimeConfig);
  }

  // Load user config (highest priority)
  const configPath = getConfigPath();
  const userConfig = await readJsonFile<Partial<Config>>(configPath);
  if (userConfig) {
    mergedConfig = mergeConfigs(mergedConfig, userConfig);
  }

  return mergedConfig;
};

export const updateConfig = async (updates: Partial<Config>): Promise<void> => {
  const configPath = getConfigPath();

  // Read existing user config to preserve other fields
  const existingUserConfig = await readJsonFile<Partial<Config>>(configPath) || {};

  // When updating, merge remoteHostsUris if provided
  const updatedConfig: Partial<Config> = {
    ...existingUserConfig,
    ...updates,
    ...(updates.remoteHostsUris ? {
      remoteHostsUris: {
        ...(existingUserConfig.remoteHostsUris || {}),
        ...updates.remoteHostsUris,
      },
    } : {}),
  };

  await writeJsonFile(configPath, updatedConfig);
};

export const setConfigValue = async (key: string, value: string): Promise<void> => {
  const configPath = getConfigPath();

  // Read existing user config
  const userConfig = await readJsonFile<Partial<Config>>(configPath) || {};

  const keys = key.split('.');
  let current: any = userConfig;

  // Navigate/create the path in user config
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (!(k in current) || typeof current[k] !== 'object' || current[k] === null) {
      current[k] = {};
    }
    current = current[k];
  }

  const lastKey = keys[keys.length - 1];

  // Validate the key exists in the merged config
  const mergedConfig = await loadConfig();
  let validationCurrent: any = mergedConfig;
  for (const k of keys) {
    if (!(k in validationCurrent)) {
      throw new Error(`Invalid configuration key: ${key}`);
    }
    validationCurrent = validationCurrent[k];
  }

  // Set the value in user config
  current[lastKey] = value;

  await writeJsonFile(configPath, userConfig);
};

export const getRemoteHostsNames = async (): Promise<string[]> => {
  const config = await loadConfig();
  return Object.keys(config.remoteHostsUris);
};

export const getRemoteHostUrl = async (name: string): Promise<string | null> => {
  const config = await loadConfig();
  return config.remoteHostsUris[name] || null;
};

export const restoreConfigToDefaults = async (): Promise<void> => {
  const configPath = getConfigPath();
  const defaultConfig = getDefaultConfig();
  await writeJsonFile(configPath, defaultConfig);
};
