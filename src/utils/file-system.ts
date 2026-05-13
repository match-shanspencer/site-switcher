import { existsSync, mkdirSync } from "fs";
import { readFile, writeFile, mkdir } from "fs/promises";
import { dirname } from "path";

export const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
};

export const ensureDirectoryExistsSync = (dirPath: string): void => {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
};

export const readFileIfExists = async (filePath: string): Promise<string | null> => {
  try {
    const content = await readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw error;
  }
};

export const writeFileAtomic = async (filePath: string, content: string): Promise<void> => {
  const dir = dirname(filePath);
  await ensureDirectoryExists(dir);

  const tempPath = `${filePath}.tmp`;
  await writeFile(tempPath, content, "utf-8");

  await Bun.write(filePath, content);

  try {
    await Bun.$`rm -f ${tempPath}`;
  } catch {
    // Ignore cleanup errors
  }
};

export const writeFileAsync = async (filePath: string, content: string) => {
  const dir = dirname(filePath);
  await ensureDirectoryExists(dir);

  await Bun.write(filePath, content);
};

export const fileExists = async (filePath: string): Promise<boolean> => {
  return existsSync(filePath);
};

export const fileExistsSync = (filePath: string): boolean => {
  return existsSync(filePath);
};

export const readJsonFile = async <T>(filePath: string): Promise<T | null> => {
  const content = await readFileIfExists(filePath);
  if (content === null) {
    return null;
  }
  return JSON.parse(content);
};

export const writeJsonFile = async <T>(filePath: string, data: T): Promise<void> => {
  const content = JSON.stringify(data, null, 2);
  await writeFileAtomic(filePath, content);
};
