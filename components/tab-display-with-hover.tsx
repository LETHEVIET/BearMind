import { Globe } from "lucide-react";
import { BrowserTab } from "@/utils/browser-tabs";
import { useState } from "react";

// TabDisplayWithHover component - simpler version with hover for URL
export interface TabDisplayWithHoverProps {
  tab: BrowserTab;
  hasHighlight?: string;
}

export const TabDisplayWithHover = ({
  tab,
  hasHighlight = "",
}: TabDisplayWithHoverProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Approximate number of characters for 3 lines (adjust as needed)
  const shouldTruncate = hasHighlight.length > 180;

  const truncatedText = shouldTruncate
    ? `${hasHighlight.substring(0, 180)}...`
    : hasHighlight;

  return (
    <div className="flex-col text-xs relative">
      {hasHighlight !== "" ? (
        <div
          className="flex-col items-center gap-0 p-0"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="flex items-center gap-2 py-0 px-1 border rounded-sm w-fit">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 flex items-center justify-center">
                {tab.favicon ? (
                  <img src={tab.favicon} alt="" className="h-3.5 w-3.5" />
                ) : (
                  <Globe className="h-3.5 w-3.5" />
                )}
              </div>

              <span className="truncate max-w-[150px] text-xs">{tab.title}</span>
            </div>

            <span className="text-xs text-muted-foreground">:highlight</span>

            {isHovering && (
              <div className="absolute bottom-full left-0 bg-popover text-popover-foreground p-2 rounded-md shadow-md text-xs mb-1 w-max max-w-[300px] break-all">
                {tab.url}
              </div>
            )}
          </div>
          <div
            className="italic mt-0 p-1 border-l"
            onClick={() => shouldTruncate && setIsExpanded(!isExpanded)}
          >
            {shouldTruncate && isExpanded ? hasHighlight : truncatedText}
            {shouldTruncate && (
              <div className="text-blue-500 cursor-pointer mt-1">
                {isExpanded ? "Click to collapse" : "Click to expand"}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className="flex items-center gap-2 py-0 px-1 border rounded-sm w-fit"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="w-4 h-4 flex items-center justify-center">
            {tab.favicon ? (
              <img src={tab.favicon} alt="" className="h-3.5 w-3.5" />
            ) : (
              <Globe className="h-3.5 w-3.5" />
            )}
          </div>

          <span className="truncate max-w-[150px] text-xs">{tab.title}</span>

          {isHovering && (
            <div className="absolute bottom-full left-0 bg-popover text-popover-foreground p-2 rounded-md shadow-md text-xs mb-1 w-max max-w-[300px] break-all">
              {tab.url}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
