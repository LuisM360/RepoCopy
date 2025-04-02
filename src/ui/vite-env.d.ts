/// <reference types="vite/client" />

// Define these interfaces globally for the UI code
// Ensure they match the definitions in preload.cts and main.ts

interface FileTreeNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: FileTreeNode[];
}

interface ElectronAPI {
  openDirectoryDialog: () => Promise<string | null>;
  getDirectoryStructure: (dirPath: string) => Promise<FileTreeNode[] | null>;
  getFileContent: (filePath: string) => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
