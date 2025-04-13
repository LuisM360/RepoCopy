import { useState, useEffect, useMemo } from "react"; // Import useEffect and useMemo
import { get_encoding } from "tiktoken"; // Import tiktoken's get_encoding
import { Button } from "@/components/ui/button";
import { Code, FolderOpen, Settings, Circle } from "lucide-react";
import { ProjectFileExplorer } from "./ProjectFileExplorer"; // Fix import name
import { PreviewPane } from "./PreviewPane"; // Import PreviewPane
import { formatBytes } from "@/lib/utils"; // Assuming a utility function for formatting bytes

// --- Type Definitions ---
interface FileSystemEntry {
  // Rename interface
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: FileSystemEntry[]; // Use new name recursively
}

interface ElectronAPI {
  openDirectoryDialog: () => Promise<string | null>;
  getDirectoryStructure: (dirPath: string) => Promise<FileSystemEntry[] | null>; // Use new name
  getFileContent: (filePath: string) => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
// --- End Type Definitions ---

// Helper function to find a node by path in the tree
const findNodeByPath = (
  nodes: FileSystemEntry[] | null | undefined, // Use new name
  path: string
): FileSystemEntry | null => {
  // Use new name
  if (!nodes) return null;
  for (const node of nodes) {
    if (node.path === path) {
      return node;
    }
    if (node.type === "directory" && node.children) {
      const found = findNodeByPath(node.children, path);
      if (found) return found;
    }
  }
  return null;
};

export function RepoCopyApp() {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileSystemEntry[] | null>(null); // Use new name
  const [isLoadingTree, setIsLoadingTree] = useState<boolean>(false); // Renamed for clarity
  const [error, setError] = useState<string | null>(null);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  // State for tiktoken encoder
  const [encoder, setEncoder] = useState<ReturnType<
    typeof get_encoding
  > | null>(null); // Let type be inferred
  // State for preview pane
  const [concatenatedContent, setConcatenatedContent] = useState<string>(""); // Renamed state
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false); // State for preview toggle
  // State for total size and tokens
  const [totalSelectedSize, setTotalSelectedSize] = useState<number>(0);
  const [tokenCounts, setTokenCounts] = useState<Map<string, number>>(
    new Map()
  ); // State for individual token counts
  const [totalTokenCount, setTotalTokenCount] = useState<number>(0); // State for total token count

  const electronAPI = window.electronAPI;

  // --- Tiktoken Initialization Effect ---
  useEffect(() => {
    try {
      const enc = get_encoding("cl100k_base"); // Use get_encoding
      setEncoder(enc);
      console.log("Tiktoken encoder initialized.");
    } catch (err) {
      console.error("Failed to initialize tiktoken encoder:", err);
      setError("Failed to initialize tokenizer.");
    }

    // Cleanup function
    return () => {
      if (encoder) {
        encoder.free();
        console.log("Tiktoken encoder freed.");
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount
  // --- End Tiktoken Initialization ---

  const handleSelectProject = async () => {
    setError(null);
    setIsLoadingTree(true);
    setFileTree(null);
    setSelectedPath(null);
    setSelectedPaths(new Set());
    setConcatenatedContent(""); // Clear preview on new project selection
    setTotalSelectedSize(0); // Reset size
    setTokenCounts(new Map()); // Reset token counts
    setTotalTokenCount(0); // Reset total tokens
    console.log("Requesting directory selection...");
    try {
      const path = await electronAPI.openDirectoryDialog();
      console.log("Directory selected:", path);
      if (path) {
        setSelectedPath(path);
        console.log("Fetching directory structure for:", path);
        const structure = await electronAPI.getDirectoryStructure(path);
        console.log("Structure received:", structure);
        if (structure) {
          setFileTree(structure);
        } else {
          setError("Failed to load directory structure.");
        }
      } else {
        console.log("Directory selection cancelled.");
      }
    } catch (err) {
      console.error("Error selecting project or fetching structure:", err);
      setError(
        err instanceof Error ? err.message : "An unknown error occurred."
      );
    } finally {
      setIsLoadingTree(false);
    }
  };

  const handleSelectionChange = (newSelection: Set<string>) => {
    console.log("New selection:", newSelection);
    setSelectedPaths(newSelection);
    console.log("Selected paths updated:", newSelection);
  };

  // Effect to fetch content and calculate tokens when selection changes
  useEffect(() => {
    const fetchContentAndTokens = async () => {
      if (selectedPaths.size === 0 || !encoder) {
        // Also check if encoder is ready
        setConcatenatedContent("");
        setTotalSelectedSize(0); // Reset size if selection is empty
        setTokenCounts(new Map()); // Reset token counts
        setTotalTokenCount(0); // Reset total tokens
        setIsPreviewLoading(false);
        return;
      }

      setIsPreviewLoading(true);
      setConcatenatedContent(""); // Clear previous content
      setError(null); // Clear previous errors specific to fetching

      let accumulatedSize = 0;
      let accumulatedTokenCount = 0; // Initialize token accumulator
      const newTokenCounts = new Map<string, number>(); // Initialize new map for this run
      const contentPromises = Array.from(selectedPaths).map(async (path) => {
        try {
          // Find node to get size (if available)
          const node = findNodeByPath(fileTree, path);
          if (node?.size) {
            accumulatedSize += node.size;
          }

          const content = await electronAPI.getFileContent(path);
          if (content !== null) {
            // Calculate tokens
            const tokens = encoder.encode(content);
            newTokenCounts.set(path, tokens.length);
            accumulatedTokenCount += tokens.length;

            // Use relative path for separator if possible, otherwise full path
            const separatorPath = selectedPath
              ? path.replace(selectedPath + "\\", "")
              : path; // Basic relative path
            return {
              path,
              content: `// --- ${separatorPath} ---\n\n${content}`,
            }; // Return object with path and content
          } else {
            return { path, content: `// --- Error reading file: ${path} ---` };
          }
        } catch (err) {
          console.error(`Error fetching content for ${path}:`, err);
          return {
            path,
            content: `// --- Exception reading file: ${path} ---`,
          };
        }
      });

      try {
        const results = await Promise.all(contentPromises);
        setConcatenatedContent(results.map((r) => r.content).join("\n\n")); // Join only the content part
        setTotalSelectedSize(accumulatedSize);
        setTokenCounts(newTokenCounts); // Update token counts map state
        setTotalTokenCount(accumulatedTokenCount); // Update total token count state
      } catch (err) {
        console.error("Error processing file contents:", err);
        setError("An error occurred while processing file contents.");
        setConcatenatedContent("// --- Error loading preview ---");
        setTotalSelectedSize(0);
        setTokenCounts(new Map());
        setTotalTokenCount(0);
      } finally {
        setIsPreviewLoading(false);
      }
    };

    fetchContentAndTokens();
  }, [selectedPaths, electronAPI, fileTree, selectedPath, encoder]); // Add encoder to dependencies

  const formattedSize = formatBytes(totalSelectedSize);

  // --- Derived State for Selected Entries ---
  const selectedEntries = useMemo(() => {
    if (!fileTree) return [];
    return Array.from(selectedPaths)
      .map((path) => findNodeByPath(fileTree, path)) // Assuming findNodeByPath exists
      .filter(
        (node): node is FileSystemEntry => node !== null && node.type === "file"
      );
  }, [selectedPaths, fileTree]);
  // --- End Derived State ---

  // --- Event Handlers ---
  const handleTogglePreview = () => setIsPreviewMode((prev) => !prev);
  // --- End Event Handlers ---

  return (
    <div className="flex flex-col h-screen bg-gray-100 text-gray-800">
      {/* App Header */}
      <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div className="flex items-center space-x-3">
          <Code className="w-6 h-6 text-blue-600" />
          <h1 className="text-xl font-bold">RepoCopy</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={handleSelectProject} disabled={isLoadingTree}>
            <FolderOpen className="w-4 h-4 mr-2" />
            {isLoadingTree ? "Loading..." : "Select Project"}
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-600">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 gap-4 p-4 overflow-hidden">
        {/* File Explorer Pane */}
        <div className="w-1/3 border rounded-lg bg-white p-4 overflow-auto flex flex-col">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="text-lg font-semibold text-gray-700">
              Project Files
            </h2>
            {/* Expand button placeholder */}
          </div>
          <div className="flex-1 overflow-auto">
            {isLoadingTree && (
              <p className="text-sm text-gray-500">Loading tree...</p>
            )}
            {error && <p className="text-sm text-red-500">Error: {error}</p>}
            {!isLoadingTree && !error && fileTree && (
              <ProjectFileExplorer // Use new component name
                rootEntries={fileTree} // Use new prop name
                selectedPaths={selectedPaths}
                onSelectionChange={handleSelectionChange}
              />
            )}
            {!isLoadingTree && !error && !fileTree && selectedPath && (
              <p className="text-sm text-gray-500">
                Directory loaded, but no files/folders found or structure is
                empty.
              </p>
            )}
            {!isLoadingTree && !error && !fileTree && !selectedPath && (
              <p className="text-sm text-gray-500">
                Select a project folder to view files.
              </p>
            )}
          </div>
        </div>

        {/* Preview Pane */}
        <PreviewPane
          className="w-2/3" // Apply width here
          concatenatedContent={concatenatedContent} // Pass concatenated content
          selectedEntries={selectedEntries} // Pass the derived entries
          tokenCounts={tokenCounts} // Pass the token map
          isPreviewMode={isPreviewMode} // Pass the toggle state
          onTogglePreview={handleTogglePreview} // Pass the toggle handler
          isLoading={isPreviewLoading}
        />
      </main>

      {/* Status Bar */}
      <footer className="p-2 px-4 border-t border-gray-200 bg-white text-sm text-gray-600 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-4">
          <span>{selectedPaths.size} files selected</span>
          <span>Total size: {formattedSize}</span>
          <span className="ml-4">
            Total tokens: {totalTokenCount.toLocaleString()}
          </span>{" "}
          {/* Display total tokens */}
        </div>
        <div className="flex items-center space-x-2">
          <Circle
            className={`w-3 h-3 ${
              selectedPaths.size > 0 ? "text-green-500" : "text-gray-400"
            }`}
          />
          <span>{selectedPaths.size > 0 ? "Ready to copy" : "Idle"}</span>
        </div>
      </footer>
    </div>
  );
}
