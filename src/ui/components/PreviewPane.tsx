import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardCopy, Eye, Check } from "lucide-react";
import { cn } from "@/lib/utils"; // Assuming utils for classnames

interface PreviewPaneProps {
  content: string;
  isLoading: boolean;
  className?: string;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({
  content,
  isLoading,
  className,
}) => {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
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
          <Button variant="outline" size="sm" disabled>
            {" "}
            {/* Preview disabled for now */}
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          <Button
            size="sm"
            onClick={handleCopy}
            disabled={!content || isLoading}
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
      <ScrollArea className="flex-1 bg-gray-50 rounded-lg border">
        <pre className="text-sm p-4 whitespace-pre-wrap break-words">
          {isLoading
            ? "Loading content..."
            : content || "Select files to see their content here."}
        </pre>
      </ScrollArea>
    </div>
  );
};
