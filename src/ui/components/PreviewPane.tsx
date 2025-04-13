import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardCopy, Eye, Check, FileCode, List } from "lucide-react"; // Added FileCode, List
import { cn, formatBytes } from "@/lib/utils"; // Assuming utils for classnames, added formatBytes

// Re-using the FileSystemEntry interface definition (adjust path if needed)
// If FileSystemEntry is defined globally or in a shared types file, import it instead.
interface FileSystemEntry {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: FileSystemEntry[];
}

interface PreviewPaneProps {
  concatenatedContent: string; // Renamed from content
  selectedEntries: FileSystemEntry[]; // New prop for file list
  tokenCounts: Map<string, number>; // New prop for token counts
  isPreviewMode: boolean; // New prop for toggling view
  onTogglePreview: () => void; // New prop for toggle handler
  isLoading: boolean;
  className?: string;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({
  concatenatedContent, // Use new prop name
  selectedEntries,
  tokenCounts,
  isPreviewMode,
  onTogglePreview,
  isLoading,
  className,
}) => {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = async () => {
    if (!concatenatedContent) return; // Copy concatenated content
    try {
      await navigator.clipboard.writeText(concatenatedContent); // Copy concatenated content
      setHasCopied(true);
      // Reset icon after a short delay
      setTimeout(() => setHasCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy content:", err);
      // TODO: Show error feedback to user
    }
  };

  return (
    <div
      className={cn("border rounded-lg bg-white p-4 flex flex-col", className)}
    >
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-lg font-semibold text-gray-700">
          Selected Content
        </h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onTogglePreview} // Attach handler
            disabled={isLoading || selectedEntries.length === 0} // Disable if loading or no files selected
          >
            {isPreviewMode ? (
              <List className="w-4 h-4 mr-2" /> // Show List icon when in preview mode
            ) : (
              <Eye className="w-4 h-4 mr-2" /> // Show Eye icon when in list mode
            )}
            {isPreviewMode ? "Show Files" : "Preview"} {/* Toggle text */}
          </Button>
          <Button
            size="sm"
            onClick={handleCopy}
            disabled={!concatenatedContent || isLoading || !isPreviewMode} // Disable copy if not in preview mode
            variant={hasCopied ? "secondary" : "default"}
            className="bg-green-600 hover:bg-green-700 text-white w-[160px]" // Fixed width for consistency
          >
            {hasCopied ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <ClipboardCopy className="w-4 h-4 mr-2" />
            )}
            {hasCopied ? "Copied!" : "Copy to Clipboard"}
          </Button>
        </div>
      </div>
      {/* Conditional Content Area */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Loading...
          </div>
        ) : isPreviewMode ? (
          // Preview Mode: Show concatenated content
          <ScrollArea className="h-full bg-gray-50 rounded-lg border">
            <pre className="text-sm p-4 whitespace-pre-wrap break-words">
              {concatenatedContent || "Select files to see their content here."}
            </pre>
          </ScrollArea>
        ) : (
          // File List Mode: Show list of selected files
          <ScrollArea className="h-full" id="file-list">
            <div className="p-4 space-y-3">
              {selectedEntries.length > 0 ? (
                selectedEntries.map((entry) => {
                  const tokens = tokenCounts.get(entry.path);
                  // Basic relative path calculation (can be improved)
                  const displayPath = entry.path
                    .split(/[\\/]/)
                    .slice(-2)
                    .join("/"); // Show last dir + filename
                  return (
                    <div
                      key={entry.id}
                      className="file-entry bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 overflow-hidden mr-2">
                          <FileCode className="w-4 h-4 text-blue-500 shrink-0" />
                          <span
                            className="font-medium truncate"
                            title={entry.name}
                          >
                            {entry.name}
                          </span>
                        </div>
                        <span
                          className="text-xs text-gray-500 shrink-0"
                          title={entry.path}
                        >
                          {displayPath}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-600 flex space-x-3">
                        {entry.size !== undefined && (
                          <span className="inline-block px-2 py-0.5 bg-gray-100 rounded">
                            Size: {formatBytes(entry.size)}
                          </span>
                        )}
                        {tokens !== undefined && (
                          <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                            Tokens: {tokens.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 text-center py-10">
                  Select files from the left panel to see details here.
                </p>
              )}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};
