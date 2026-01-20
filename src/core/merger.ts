import type { MergeResult } from '../types';
import { extractHostnames } from './hosts-manager';

export const mergeHostsFiles = (remoteContent: string, overridesContent: string, remoteName: string): MergeResult => {
  const lines: string[] = [];
  let overrideCount = 0;
  let commentedCount = 0;

  const overrideHostnames = extractHostnames(overridesContent);

  lines.push('# === OVERRIDES ===');

  const overrideLines = overridesContent.split('\n');
  for (const line of overrideLines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      overrideCount++;
    }
    lines.push(line);
  }

  lines.push('');
  lines.push(`# === REMOTE HOSTS (${remoteName}) ===`);

  const remoteLines = remoteContent.split('\n');
  for (const line of remoteLines) {
    const trimmed = line.trim();

    if (trimmed === '' || trimmed.startsWith('#')) {
      lines.push(line);
      continue;
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length < 2) {
      lines.push(line);
      continue;
    }

    const hostnames = parts.slice(1);
    const hasOverride = hostnames.some(hostname => overrideHostnames.has(hostname));

    if (hasOverride) {
      lines.push(`# ${line}  # Overridden above`);
      commentedCount++;
    } else {
      lines.push(line);
    }
  }

  const content = lines.join('\n');

  return {
    content,
    overrideCount,
    commentedCount,
  };
};
