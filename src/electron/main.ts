import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "path";
import fs from "fs/promises"; // Use promises API for async operations
import { isDev } from "./util.js";
import { getPreloadPath } from "./pathResolver.js";
import { fdir } from "fdir";
import { DEFAULT_GLOBAL_EXCLUSIONS } from "./exclusions.js";
import isBinaryPath from "is-binary-path";

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
let currentProjectPath: string | null = null;

async function getFileSystemEntriesRecursive( // Rename function
  dirPath: string
): Promise<FileSystemEntry[]> {
  const crawler = new fdir()
    .withFullPaths()
    .withBasePath()
    .exclude((dirName) => DEFAULT_GLOBAL_EXCLUSIONS.DIRECTORIES.has(dirName))
    .filter((path, isDir) => {
      if (isDir) return true;
      const ext = path.slice(path.lastIndexOf(".")).toLowerCase();
      return (
        !DEFAULT_GLOBAL_EXCLUSIONS.BINARY_EXTENSIONS.has(ext) &&
        !isBinaryPath(path)
      );
    });

  try {
    const absolutePaths = await crawler.crawl(dirPath).withPromise();
    // Convert absolute paths to relative paths
    const relativePaths = absolutePaths.map((p) => path.relative(dirPath, p));

    return buildTree(relativePaths);
  } catch (error) {
    console.error("Failed to traverse directory:", error);
    return [];
  }
}

function buildTree(filePaths: string[]): FileSystemEntry[] {
  const root: FileSystemEntry = {
    id: "",
    name: "",
    path: "",
    type: "directory",
    children: [],
  };
  const map = new Map<string, FileSystemEntry>();
  map.set("", root);

  filePaths.forEach((filePath) => {
    // Split using OS-specific separator
    const parts = filePath.split(path.sep);
    let parentPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const fullPath = parentPath ? `${parentPath}${path.sep}${part}` : part;

      if (!map.has(fullPath)) {
        map.set(fullPath, {
          id: fullPath,
          name: part,
          path: fullPath,
          type: i === parts.length - 1 ? "file" : "directory",
          children: [],
        });
        const parent = map.get(parentPath)!;
        parent.children!.push(map.get(fullPath)!);
      }

      parentPath = fullPath;
    }
  });

  return root.children!;
}

async function readFileContent(filePath: string): Promise<string | null> {
  if (!currentProjectPath) {
    console.error("No project path set. Cannot read file.");
    return null;
  }
  const fullPath = path.join(currentProjectPath, filePath);
  try {
    const content = await fs.readFile(fullPath, "utf-8");
    return content;
  } catch (error) {
    console.error(`Error reading file ${fullPath}:`, error);
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

  currentProjectPath = dirPath;

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
