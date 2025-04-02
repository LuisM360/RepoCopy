// src/electron/preload.cts
import { contextBridge, ipcRenderer } from "electron";

// Re-define the FileTreeNode structure here for type safety in the exposed API
// (Alternatively, could share types between main/preload/renderer, but this is simpler for now)
interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: FileTreeNode[];
}

// Define the updated type for our exposed API
interface ElectronAPI {
  openDirectoryDialog: () => Promise<string | null>;
  getDirectoryStructure: (dirPath: string) => Promise<FileTreeNode[] | null>;
  getFileContent: (filePath: string) => Promise<string | null>;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  openDirectoryDialog: () => ipcRenderer.invoke("dialog:openDirectory"),
  getDirectoryStructure: (dirPath: string) =>
    ipcRenderer.invoke("fs:getDirectoryStructure", dirPath),
  getFileContent: (filePath: string) =>
    ipcRenderer.invoke("fs:getFileContent", filePath),
} as ElectronAPI);

// Add a declaration for the global window object to include our API
// This helps TypeScript in the renderer process understand the exposed API
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
