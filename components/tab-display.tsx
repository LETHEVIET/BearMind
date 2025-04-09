import { Globe, Eye, EyeOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrowserTab } from "@/utils/browser-tabs";

// Tab display component
export interface TabDisplayProps {
  tab: BrowserTab;
  isCurrentTab?: boolean;
  useCurrentTab?: boolean;
  onToggleVisibility?: () => void;
  onRemove?: () => void;
  hasHighlight?: string;
}

export const TabDisplay = ({
  tab,
  isCurrentTab = false,
  useCurrentTab = true,
  onToggleVisibility,
  onRemove,
  hasHighlight = "",
}: TabDisplayProps) => {
  return (
    <div className="flex items-center gap-2 pl-1 gap-2 border rounded-lg text-xs">
      <div className="w-4 h-4 flex items-center justify-center">
        {tab.favicon ? (
          <img src={tab.favicon} alt="" className="h-3.5 w-3.5" />
        ) : (
          <Globe className="h-3.5 w-3.5" />
        )}
      </div>

      {isCurrentTab ? (
        <>
          <span
            className={`truncate max-w-[80px] ${
              !useCurrentTab ? "line-through italic" : ""
            }`}
          >
            {tab.title}
          </span>
          {hasHighlight != "" && (
            <span className="text-xs text-muted-foreground">:highlight</span>
          )}
          <p className="text-muted-foreground text-[10px]">Current tab</p>
          <Button
            size={"no"}
            variant="ghost"
            className="flex p-1 items-center gap-2 rounded-none gap-2 hover:text-foreground hover:bg-muted text-xs"
            onClick={onToggleVisibility}
          >
            {useCurrentTab ? (
              <Eye className="h-4 w-4 text-muted-foreground" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </>
      ) : (
        <>
          <span className="p-1 truncate max-w-[80px]">{tab.title}</span>
          <Button
            size={"no"}
            variant="ghost"
            className="flex p-1 items-center gap-2 rounded-none gap-2 hover:text-foreground hover:bg-muted text-xs"
            onClick={onRemove}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        </>
      )}
    </div>
  );
};
