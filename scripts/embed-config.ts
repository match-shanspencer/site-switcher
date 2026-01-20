#!/usr/bin/env bun
// Build script to embed config.local.json into the binary

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const CONFIG_LOCAL_PATH = join(process.cwd(), 'config.local.json');
const OUTPUT_PATH = join(process.cwd(), 'src/core/build-time-config.ts');

async function embedConfig(): Promise<void> {
  let configContent: string | null = null;

  if (existsSync(CONFIG_LOCAL_PATH)) {
    try {
      const content = await readFile(CONFIG_LOCAL_PATH, 'utf-8');
      // Parse and re-stringify to ensure valid JSON
      const parsed = JSON.parse(content);
      configContent = JSON.stringify(parsed, null, 2);
      console.log(`✓ Found config.local.json, embedding into binary...`);
    } catch (error) {
      console.warn(`⚠ Warning: Failed to parse config.local.json: ${(error as Error).message}`);
      console.warn(`  Continuing without embedded config...`);
    }
  } else {
    // If config.local.json doesn't exist, embed empty object
    configContent = JSON.stringify({}, null, 2);
    console.log(`ℹ No config.local.json found, embedding empty object {}`);
  }

  const outputContent = `// This file is auto-generated at build time
// It embeds config.local.json into the binary
// DO NOT EDIT MANUALLY - run "bun run scripts/embed-config.ts" to regenerate

import type { Config } from '../types';

// Embedded build-time config (injected during build)
// Generated from config.local.json (or empty object {} if file doesn't exist)
export const EMBEDDED_BUILD_TIME_CONFIG: Partial<Config> | null = ${
    configContent || 'null'
  };
`;

  await writeFile(OUTPUT_PATH, outputContent, 'utf-8');
  console.log(`✓ Generated ${OUTPUT_PATH}`);
}

embedConfig().catch((error) => {
  console.error(`✗ Failed to embed config: ${error.message}`);
  process.exit(1);
});
