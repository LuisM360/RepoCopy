import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "path";
import fs from "fs/promises"; // Use promises API for async operations
import { isDev } from "./util.js";
import { getPreloadPath } from "./pathResolver.js";

// Define the structure for file system entries
interface FileSystemEntry {
  id: string; // Unique ID, could be the full path
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number; // Size in bytes, mainly for files
  children?: FileSystemEntry[]; // Use the new name recursively
}

let mainWindow: BrowserWindow | null = null;

async function getFileSystemEntriesRecursive( // Rename function
  dirPath: string
): Promise<FileSystemEntry[]> {
  // Use new name in return type
  const entries: FileSystemEntry[] = []; // Use new name for variable type
  try {
    const dirents = await fs.readdir(dirPath, { withFileTypes: true });
    for (const dirent of dirents) {
      const fullPath = path.join(dirPath, dirent.name);
      try {
        const stats = await fs.stat(fullPath);
        const entry: FileSystemEntry = {
          // Rename variable node -> entry
          // Use new name for variable type
          id: fullPath,
          name: dirent.name,
          path: fullPath,
          type: dirent.isDirectory() ? "directory" : "file",
        };

        if (dirent.isDirectory()) {
          entry.children = await getFileSystemEntriesRecursive(fullPath); // Use new function name
        } else {
          entry.size = stats.size; // Use entry
        }
        entries.push(entry); // Use entry
      } catch (statError) {
        console.error(`Error stating file/directory ${fullPath}:`, statError);
        // Optionally add a node indicating an error or skip
      }
    }
  } catch (readError) {
    console.error(`Error reading directory ${dirPath}:`, readError);
    // Handle directory read errors (e.g., permissions)
  }
  // Sort entries: directories first, then files, alphabetically
  entries.sort((a, b) => {
    if (a.type === b.type) {
      return a.name.localeCompare(b.name);
    }
    return a.type === "directory" ? -1 : 1;
  });
  return entries;
}

async function readFileContent(filePath: string): Promise<string | null> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    resizable: true,
    maximizable: true,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev()) {
    mainWindow.loadURL("http://localhost:5123/"); // Correct port from vite.config.ts
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), "dist-react/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// --- IPC Handlers for RepoCopy ---

ipcMain.handle("dialog:openDirectory", async () => {
  // ... (previous handler remains the same)
  if (!mainWindow) {
    console.error("Main window not available for dialog");
    return null;
  }
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
      title: "Select Project Folder",
    });
    if (!canceled && filePaths.length > 0) {
      return filePaths[0];
    }
    return null;
  } catch (error) {
    console.error("Error opening directory dialog:", error);
    return null;
  }
});

ipcMain.handle("fs:getDirectoryStructure", async (_event, dirPath: string) => {
  if (!dirPath || typeof dirPath !== "string") {
    console.error("Invalid directory path received for getDirectoryStructure");
    return null;
  }
  try {
    const entries = await getFileSystemEntriesRecursive(dirPath); // Rename structure -> entries
    return entries; // Use new variable name
  } catch (error) {
    console.error(`Error getting directory structure for ${dirPath}:`, error);
    return null;
  }
});

ipcMain.handle("fs:getFileContent", async (_event, filePath: string) => {
  if (!filePath || typeof filePath !== "string") {
    console.error("Invalid file path received for getFileContent");
    return null;
  }
  try {
    const content = await readFileContent(filePath);
    return content;
  } catch (error) {
    console.error(`Error getting file content for ${filePath}:`, error);
    return null;
  }
});
