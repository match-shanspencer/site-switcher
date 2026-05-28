#!/usr/bin/env bun

import { initializeConfig } from "./core/config-manager";
import { getActiveHostsName } from "./core/hosts-manager";
import * as logger from "./utils/logger";

const showHelp = async (): Promise<void> => {
  logger.heading("SiteSwitcher - Hosts File Manager");

  const activeName = await getActiveHostsName();
  if (activeName) {
    logger.info(`Active hosts configuration: ${activeName}`);
  }

  logger.log("");
  logger.log("Usage: siteswitcher <command> [options]");
  logger.log("");
  logger.heading("Commands:");
  logger.log(
    '  set <name>              Apply a hosts configuration (custom or remote) with local overrides. Alias for "local set <name>"',
  );
  logger.log("  active                  Print the currently active hosts configuration name");
  logger.log("");
  logger.log("  custom create <name>    Create a new custom hosts file");
  logger.log("  custom edit <name>      Open a custom hosts file in editor");
  logger.log("  custom set <name>       Apply a custom hosts file (with local overrides)");
  logger.log("  custom list             List all custom hosts files");
  logger.log("");
  logger.log("  local open|edit         Edit local override entries");
  logger.log("  local set <name>        Apply a hosts configuration (custom or remote) with local overrides");
  logger.log("  local list              List all local override entries");
  logger.log("");
  logger.log("  system open|edit        Open system hosts file in editor");
  logger.log("  system restore          Reset system hosts file to default values");
  logger.log("  system list          Print contents of system hosts file");
  logger.log("");
  logger.log("  remote fetch [name]     Fetch and cache remote hosts (all if no name)");
  logger.log(
    "  remote set <name>       Apply a remote hosts configuration (without local overrides)",
  );
  logger.log("  remote list             List all remote hosts configurations");
  logger.log("");
  logger.log("  config list             Display current configuration");
  logger.log("  config open|edit        Open config file in editor");
  logger.log("  config set <key=value>  Set a configuration value");
  logger.log("  config restore          Restore configuration to defaults");
  logger.log("");
  logger.log("  version                 Show version information");
  logger.log("  help                    Show this help message");
  logger.log("");
};

const main = async (): Promise<void> => {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    await showHelp();
    process.exit(0);
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  await initializeConfig();

  try {
    switch (command) {
      case "local": {
        const { execute } = await import("./commands/local");
        await execute(commandArgs);
        break;
      }
      case "system": {
        const { execute } = await import("./commands/system");
        await execute(commandArgs);
        break;
      }
      case "remote": {
        const { execute } = await import("./commands/remote");
        await execute(commandArgs);
        break;
      }
      case "custom": {
        const { execute } = await import("./commands/custom");
        await execute(commandArgs);
        break;
      }
      case "set":
      case "use": {
        const { execute } = await import("./commands/set");
        await execute(commandArgs);
        break;
      }
      case "active": {
        const { execute } = await import("./commands/active");
        await execute();
        break;
      }
      case "config": {
        const { execute } = await import("./commands/config");
        await execute(commandArgs);
        break;
      }
      case "version": {
        const { execute } = await import("./commands/version");
        await execute();
        break;
      }
      case "help":
      case "--help":
      case "-h": {
        await showHelp();
        break;
      }
      default: {
        logger.error(`Unknown command: ${command}`);
        logger.log("");
        await showHelp();
        process.exit(1);
      }
    }
  } catch (error) {
    logger.error(`Unexpected error: ${(error as Error).message}`);
    process.exit(1);
  }
};

main();
