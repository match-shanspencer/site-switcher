import { spawn } from "child_process";
import { loadConfig } from "../core/config-manager";
import { getPlatform } from "./platform";

const getDefaultEditor = (): string => {
  const platform = getPlatform();

  if (platform === "win32") {
    return "notepad";
  }

  return "vi";
};

export const detectEditor = async (): Promise<string> => {
  const config = await loadConfig();

  if (config.editor) {
    return config.editor;
  }

  if (process.env.VISUAL) {
    return process.env.VISUAL;
  }

  if (process.env.EDITOR) {
    return process.env.EDITOR;
  }

  return getDefaultEditor();
};

export const openInEditor = async (filePath: string): Promise<void> => {
  const editor = await detectEditor();

  return new Promise((resolve, reject) => {
    const child = spawn(editor, [filePath], {
      stdio: "inherit",
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Editor exited with code: ${code}`));
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
};
