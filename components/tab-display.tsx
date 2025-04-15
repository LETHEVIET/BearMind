import {
  Globe,
  Eye,
  EyeOff,
  X,
  RefreshCw,
  FileClock,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrowserTab } from "@/utils/browser-tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChatSettings } from "@/components/ChatSettingsContext";

// Tab display component
export interface TabDisplayProps {
  tabId: number;
  isCurrentTab?: boolean;
  useCurrentTab?: boolean;
  onToggleVisibility?: () => void;
  onRemove?: () => void;
  hasHighlight?: string;
}


export const ToogleReadButton = ({
  shouldReread,
  toggleTabReread,
  tabId
}: {
  shouldReread: boolean;
  toggleTabReread: (tabId: number) => void;
  tabId: number;
}) => {
  return (
    <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size={"no"}
              variant="ghost"
              className={`flex p-1 items-center gap-2 rounded-none gap-2 text-xs ${
                // shouldReread ? "bg-primary/10" : ""
                ""
              }`}
              onClick={() => toggleTabReread(tabId)}
            >
              {shouldReread ? (
                <FileClock className="h-4 w-4 text-muted-foreground" />
              ) : (
                <FileCheck2 className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-xs">
            {shouldReread
              ? "Refresh content on each use (active)"
              : "Refresh content on each use"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
  )
}

export const TabDisplay = ({
  tabId,
  isCurrentTab = false,
  useCurrentTab = true,
  onToggleVisibility,
  onRemove,
  hasHighlight = "",
}: TabDisplayProps) => {
  const { tabs, tabsToReread, toggleTabReread } = useChatSettings();
  const tab = tabs[tabId];
  const shouldReread = tabsToReread.includes(tabId);

  return (
    <div className="flex items-center gap-0 pl-1 border rounded-lg text-xs overflow-hidden">
      <div className="w-4 h-4 flex items-center justify-center">
        {tab.favicon ? (
          <img src={tab.favicon} alt="" className="h-3.5 w-3.5" />
        ) : (
          <Globe className="h-3.5 w-3.5" />
        )}
      </div>

      {isCurrentTab ? (
        <div className="flex items-center">
          <span
            className={`truncate max-w-[80px] text-foreground ${
              !useCurrentTab ? "line-through italic" : ""
            }`}
          >
            {tab.title}
          </span>
          {hasHighlight != "" && (
            <span className="text-xs text-muted-foreground">:highlight</span>
          )}
          <p className="pl-1 align-bottom text-muted-foreground text-[10px]">Current tab</p>
          <ToogleReadButton shouldReread={shouldReread} toggleTabReread={toggleTabReread} tabId={tabId} />
          <Button
            size={"no"}
            variant="ghost"
            className="flex p-1 items-center gap-2 rounded-none gap-2 text-xs"
            onClick={onToggleVisibility}
          >
            {useCurrentTab ? (
              <Eye className="h-4 w-4 text-muted-foreground" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      ) : (
        <>
          <span className="p-1 truncate max-w-[80px]">{tab.title}</span>
          <ToogleReadButton shouldReread={shouldReread} toggleTabReread={toggleTabReread} tabId={tabId} />
          <Button
            size={"no"}
            variant="ghost"
            className="flex p-1 items-center gap-2 rounded-none gap-2 text-xs"
            onClick={onRemove}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        </>
      )}
    </div>
  );
};
