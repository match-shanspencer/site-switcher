import { readFile } from 'fs/promises';
import type { HostsEntry, ParsedHostsFile } from '../types';
import { getOverridesPath, getTempMergedPath, getTempDirectory } from '../utils/platform';
import { readFileIfExists, writeFileAtomic, ensureDirectoryExists, writeFileAsync } from '../utils/file-system';
import { loadConfig } from './config-manager';
// import { spawn } from 'child_process';


export const parseHostsFile = (content: string): ParsedHostsFile => {
  const lines = content.split('\n');
  const entries: HostsEntry[] = [];
  const comments: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '' || trimmed.startsWith('#')) {
      comments.push(line);
      continue;
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) {
      comments.push(line);
      continue;
    }

    const ip = parts[0];
    const hostnames = parts.slice(1);

    entries.push({ ip, hostnames });
  }

  return { entries, comments };
};

export const extractHostnames = (content: string): Set<string> => {
  const parsed = parseHostsFile(content);
  const hostnames = new Set<string>();

  for (const entry of parsed.entries) {
    for (const hostname of entry.hostnames) {
      hostnames.add(hostname);
    }
  }

  return hostnames;
};

export const readSystemHostsFile = async (): Promise<string> => {
  const config = await loadConfig();
  const content = await readFile(config.hostsPath, 'utf-8');
  return content;
};

export const readOverridesFile = async (): Promise<string> => {
  const overridesPath = getOverridesPath();
  const content = await readFileIfExists(overridesPath);
  return content || '';
};

export const ensureOverridesFileExists = async (): Promise<void> => {
  const overridesPath = getOverridesPath();
  const content = await readFileIfExists(overridesPath);

  if (content === null) {
    await writeFileAtomic(overridesPath, '# Local overrides\n# Add your custom host entries here\n\n');
  }
};

export const applyHostsFile = async (content: string): Promise<void> => {
  const config = await loadConfig();

  await ensureDirectoryExists(getTempDirectory());

  const tempPath = getTempMergedPath();
  await writeFileAtomic(tempPath, content);
  await writeFileAsync(config.hostsPath, content);

  // return new Promise((resolve, reject) => {
  //   const child = spawn('sudo', ['cp', tempPath, config.hostsPath], {
  //     stdio: 'inherit',
  //   });

  //   child.on('close', (code) => {
  //     if (code === 0) {
  //       resolve();
  //     } else {
  //       reject(new Error(`Failed to apply hosts file (exit code: ${code})`));
  //     }
  //   });

  //   child.on('error', (error) => {
  //     reject(error);
  //   });
  // });
};

export const getActiveHostsName = async (): Promise<string | null> => {
  const { getActivePath } = await import('../utils/platform');
  const content = await readFileIfExists(getActivePath());
  return content?.trim() || null;
};

export const setActiveHostsName = async (name: string): Promise<void> => {
  const { getActivePath } = await import('../utils/platform');
  await writeFileAtomic(getActivePath(), name);
};

export const clearActiveHostsName = async (): Promise<void> => {
  const { getActivePath } = await import('../utils/platform');
  const { readFileIfExists, writeFileAtomic } = await import('../utils/file-system');
  const activePath = getActivePath();
  const content = await readFileIfExists(activePath);
  if (content) {
    await writeFileAtomic(activePath, '');
  }
};
