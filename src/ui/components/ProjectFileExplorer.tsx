import React, { useCallback } from "react";
import { Folder, FileCode } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox

// Re-using the FileSystemEntry interface definition
interface FileSystemEntry {
  // Rename interface
  id: string; // Using path as id
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: FileSystemEntry[]; // Use new name recursively
}

interface ProjectFileExplorerProps {
  // Rename interface
  rootEntries: FileSystemEntry[]; // Rename nodes -> rootEntries
  selectedPaths: Set<string>; // Set of selected file paths
  onSelectionChange: (newSelection: Set<string>) => void; // Callback for changes
}

interface FileExplorerItemProps {
  // Rename interface
  entry: FileSystemEntry; // Rename node -> entry
  level: number;
  selectedPaths: Set<string>;
  onToggleNode: (entry: FileSystemEntry, isSelected: boolean) => void; // Use new name here too
}

// Helper function to get all descendant file paths within a directory entry
const getAllDescendantFilePaths = (node: FileSystemEntry): string[] => {
  // Rename function
  // Use new name
  if (node.type === "file") {
    return [node.path];
  }
  if (!node.children) {
    return [];
  }
  return node.children.flatMap(getAllDescendantFilePaths); // Update recursive call
};

// Helper function to determine directory selection state
const getDirectorySelectionState = (
  // Rename function
  node: FileSystemEntry, // Use new name
  selectedPaths: Set<string>
): { checked: boolean | "indeterminate"; allFiles: string[] } => {
  const allFiles = getAllDescendantFilePaths(node); // Use new function name
  if (allFiles.length === 0) {
    return { checked: false, allFiles: [] }; // Empty directory can't be checked
  }
  const selectedFilesInNode = allFiles.filter((path) =>
    selectedPaths.has(path)
  );

  if (selectedFilesInNode.length === 0) {
    return { checked: false, allFiles };
  }
  if (selectedFilesInNode.length === allFiles.length) {
    return { checked: true, allFiles };
  }
  return { checked: "indeterminate", allFiles };
};

const FileExplorerItem: React.FC<FileExplorerItemProps> = ({
  // Use new interface name
  // Rename component
  entry, // Use new prop name
  level,
  selectedPaths,
  onToggleNode,
}) => {
  const isDirectory = entry.type === "directory"; // Use entry
  const Icon = isDirectory ? Folder : FileCode;

  let checkedState: boolean | "indeterminate" = false;
  let allFiles: string[] = []; // Files affected by toggling this node
  if (isDirectory) {
    const dirState = getDirectorySelectionState(entry, selectedPaths); // Use new function name
    checkedState = dirState.checked;
    allFiles = dirState.allFiles;
  } else {
    checkedState = selectedPaths.has(entry.path); // Use entry
    allFiles = [entry.path]; // Use entry
  }

  const handleCheckedChange = () => {
    // Argument 'isChecked' is not needed if logic depends on current state
    // If current state is true, we want to deselect (target=false)
    // Otherwise (current state is false or indeterminate), we want to select (target=true)
    const targetSelectedState = checkedState !== true;
    onToggleNode(entry, targetSelectedState); // Use entry
  };

  return (
    <div style={{ paddingLeft: `${level * 1.0}rem` }}>
      {" "}
      {/* Reduced indent */}
      <div className="flex items-center p-1 hover:bg-gray-100 rounded text-sm group">
        <Checkbox
          id={entry.id} // Use entry
          checked={checkedState}
          onCheckedChange={handleCheckedChange}
          className="mr-2"
          // Disable checkbox for empty directories
          disabled={isDirectory && allFiles.length === 0}
        />
        <label
          htmlFor={entry.id} // Use entry
          className="flex items-center cursor-pointer flex-grow"
        >
          <Icon
            className={`w-4 h-4 mr-2 shrink-0 ${
              isDirectory ? "text-yellow-500" : "text-blue-500"
            }`}
            strokeWidth={1.5}
          />
          <span className="truncate" title={entry.name}>
            {" "}
            {/* Use entry */}
            {entry.name} {/* Use entry */}
          </span>
        </label>
      </div>
      {/* Render children recursively */}
      {isDirectory &&
        entry.children &&
        entry.children.length > 0 && ( // Use entry
          <div className="mt-1">
            {" "}
            {/* Add slight margin for children */}
            {entry.children.map(
              (
                child // Use entry
              ) => (
                <FileExplorerItem // Use new component name
                  key={child.id}
                  entry={child} // Pass prop as 'entry'
                  level={level + 1}
                  selectedPaths={selectedPaths}
                  onToggleNode={onToggleNode}
                />
              )
            )}
          </div>
        )}
    </div>
  );
};
export const ProjectFileExplorer: React.FC<ProjectFileExplorerProps> = ({
  // Use new interface name
  // Rename component
  rootEntries, // Use new prop name
  selectedPaths,
  onSelectionChange,
}) => {
  const handleToggleNode = useCallback(
    (node: FileSystemEntry, shouldBeSelected: boolean) => {
      // Use new name
      const newSelection = new Set(selectedPaths);
      const filesToToggle = getAllDescendantFilePaths(node); // Use new function name

      if (shouldBeSelected) {
        filesToToggle.forEach((path) => newSelection.add(path));
      } else {
        filesToToggle.forEach((path) => newSelection.delete(path));
      }
      onSelectionChange(newSelection);
    },
    [selectedPaths, onSelectionChange]
  );

  if (!rootEntries || rootEntries.length === 0) {
    // Use new prop name
    return (
      <p className="text-sm text-gray-500">
        No project selected or folder is empty.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {" "}
      {/* Remove space-y for tighter packing */}
      {rootEntries.map(
        (
          node // Use new prop name, keep 'node' for map item
        ) => (
          <FileExplorerItem // Use new component name
            key={node.id}
            entry={node} // Pass prop as 'entry'
            level={0}
            selectedPaths={selectedPaths}
            onToggleNode={handleToggleNode}
          />
        )
      )}
    </div>
  );
};
