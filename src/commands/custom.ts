import { readdir } from "fs/promises";
import { readOverridesFile, applyHostsFile, setActiveHostsName } from "../core/hosts-manager";
import { mergeHostsFiles } from "../core/merger";
import {
  getCustomDirectory,
  getCustomHostPath,
  normalizeHostName,
} from "../utils/platform";
import {
  ensureDirectoryExists,
  readFileIfExists,
  writeFileAtomic,
  fileExists,
} from "../utils/file-system";
import { openInEditor } from "../utils/editor";
import * as logger from "../utils/logger";

export const applyCustomHosts = async (rawName: string): Promise<void> => {
  const name = normalizeHostName(rawName);
  const filePath = getCustomHostPath(name);

  const customContent = await readFileIfExists(filePath);
  if (customContent === null) {
    logger.error(`Custom hosts file '${name}' not found`);
    logger.info(`Create it with: hosts custom create ${name}`);
    process.exit(1);
  }

  logger.info("Loading overrides...");
  const overridesContent = await readOverridesFile();

  logger.info("Merging hosts files...");
  const mergeResult = mergeHostsFiles(customContent, overridesContent, name);

  logger.info("Applying merged hosts file (requires sudo)...");

  try {
    await applyHostsFile(mergeResult.content);
    await setActiveHostsName(name);

    logger.success(`Applied hosts configuration: ${name}`);
    logger.info(`Overrides: ${mergeResult.overrideCount}, Commented: ${mergeResult.commentedCount}`);
  } catch (error) {
    logger.error(`Failed to apply hosts file: ${(error as Error).message}`);
    process.exit(1);
  }
};

export const execute = async (args: string[]): Promise<void> => {
  const subcommand = args[0];

  if (subcommand === "create") {
    const rawName = args[1];
    if (!rawName) {
      logger.error("Please specify a name for the custom hosts file");
      logger.info("Usage: hosts custom create <name>");
      process.exit(1);
    }

    const name = normalizeHostName(rawName);
    const filePath = getCustomHostPath(name);

    await ensureDirectoryExists(getCustomDirectory());

    if (await fileExists(filePath)) {
      logger.error(`Custom hosts file '${name}' already exists: ${filePath}`);
      process.exit(1);
    }

    await writeFileAtomic(filePath, `# Custom hosts: ${name}\n`);
    logger.success(`Created custom hosts file: ${filePath}`);
  } else if (subcommand === "edit") {
    const rawName = args[1];
    if (!rawName) {
      logger.error("Please specify a custom hosts file name");
      logger.info("Usage: hosts custom edit <name>");
      process.exit(1);
    }

    const name = normalizeHostName(rawName);
    const filePath = getCustomHostPath(name);

    if (!(await fileExists(filePath))) {
      logger.error(`Custom hosts file '${name}' not found`);
      logger.info(`Create it with: hosts custom create ${name}`);
      process.exit(1);
    }

    try {
      await openInEditor(filePath);
      logger.success("Custom hosts file updated");
    } catch (error) {
      logger.error(`Failed to open editor: ${(error as Error).message}`);
      process.exit(1);
    }
  } else if (["set", "use"].includes(subcommand)) {
    const rawName = args[1];
    if (!rawName) {
      logger.error("Please specify a custom hosts file name");
      logger.info("Usage: hosts custom set <name>");
      process.exit(1);
    }

    await applyCustomHosts(rawName);
  } else if (["list", "show"].includes(subcommand)) {
    await ensureDirectoryExists(getCustomDirectory());

    try {
      const files = await readdir(getCustomDirectory());

      if (files.length === 0) {
        logger.info("No custom hosts files found");
        return;
      }

      logger.heading("Custom Hosts Files");
      logger.log("");
      files.forEach((file) => logger.log(`  ${file}`));
    } catch (error) {
      logger.error(`Failed to list custom hosts: ${(error as Error).message}`);
      process.exit(1);
    }
  } else {
    logger.error(
      "Invalid subcommand. Use: custom create <name>, custom edit <name>, custom set <name>, or custom list",
    );
    process.exit(1);
  }
};
