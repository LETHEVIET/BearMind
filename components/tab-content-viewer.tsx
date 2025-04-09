import React, { useState, useEffect } from "react";
import { BrowserTab } from "@/utils/browser-tabs";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MemoizedMarkdown } from "./memoized-markdown";
import { Globe, ExternalLink, Maximize, Minimize, Copy } from "lucide-react";

interface TabContentViewerProps {
  markdownContents: Record<number, string>;
  tabs: BrowserTab[];
  currentTabId?: number;
}

export const TabContentViewer: React.FC<TabContentViewerProps> = ({ 
  markdownContents, 
  tabs, 
  currentTabId
}) => {
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedTabId, setCopiedTabId] = useState<string | null>(null);

  // Initialize the selected tab to the current tab if available, otherwise the first tab
  useEffect(() => {
    if (!selectedTabId && tabs.length > 0) {
      // Prefer current tab if it exists
      if (currentTabId && markdownContents[currentTabId]) {
        setSelectedTabId(currentTabId.toString());
      } else {
        // Otherwise just select the first tab in the list
        const firstTabId = Object.keys(markdownContents)[0];
        if (firstTabId) {
          setSelectedTabId(firstTabId);
        }
      }
    }
  }, [markdownContents, currentTabId, tabs, selectedTabId]);

  // Handle copying content to clipboard
  const handleCopyContent = (tabId: string) => {
    if (markdownContents[tabId]) {
      navigator.clipboard.writeText(markdownContents[tabId]);
      setCopiedTabId(tabId);
      setTimeout(() => setCopiedTabId(null), 2000);
    }
  };

  // If we have no tabs with content, show a message
  if (Object.keys(markdownContents).length === 0 || tabs.length === 0) {
    return (
      <Card className="p-4 text-center text-muted-foreground">
        No tab content has been converted to markdown yet.
      </Card>
    );
  }

  // Find tab objects that match our markdown content
  const tabsWithContent = tabs.filter(tab => 
    markdownContents[tab.id] !== undefined
  );

  // Get the content for the selected tab
  const selectedContent = selectedTabId ? markdownContents[selectedTabId] : "";

  // Find the tab object for the selected tab
  const selectedTab = tabs.find(tab => tab.id.toString() === selectedTabId);

  return (
    <Card className={`border ${isExpanded ? "fixed inset-4 z-50 flex flex-col" : "relative"}`}>
      <div className="flex items-center justify-between border-b p-3">
        <h3 className="text-lg font-semibold">Tab Content Viewer</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? "Minimize" : "Maximize"}
        >
          {isExpanded ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className={`flex ${isExpanded ? "flex-1 overflow-hidden" : ""}`}>
        <Tabs 
          defaultValue={selectedTabId || ""} 
          className="w-full"
          onValueChange={(value) => setSelectedTabId(value)}
        >
          <div className="border-b px-3">
            <TabsList className="h-auto flex-wrap gap-1 py-1">
              {tabsWithContent.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id.toString()}
                  className="flex items-center gap-1 py-1"
                >
                  {tab.favicon ? (
                    <img src={tab.favicon} alt="" className="h-3.5 w-3.5" />
                  ) : (
                    <Globe className="h-3.5 w-3.5" />
                  )}
                  <span className="truncate max-w-[100px]">{tab.title}</span>
                  {tab.id.toString() === currentTabId?.toString() && (
                    <span className="ml-1 text-xs text-muted-foreground">(current)</span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          {tabsWithContent.map((tab) => (
            <TabsContent 
              key={tab.id} 
              value={tab.id.toString()}
              className={`mt-0 ${isExpanded ? "h-full overflow-hidden" : "max-h-[400px]"}`}
            >
              <div className="flex items-center justify-between border-b bg-muted/40 p-2 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <ExternalLink className="mr-1 h-3 w-3" />
                  <a 
                    href={tab.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline truncate max-w-[300px]"
                  >
                    {tab.url}
                  </a>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleCopyContent(tab.id.toString())}
                  aria-label="Copy content"
                >
                  {copiedTabId === tab.id.toString() ? (
                    <span className="text-xs text-green-500">Copied!</span>
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
              
              <ScrollArea className={isExpanded ? "h-[calc(100%-3rem)]" : "max-h-[350px]"}>
                <div className="prose prose-sm dark:prose-invert p-4 max-w-none">
                  <MemoizedMarkdown 
                    content={markdownContents[tab.id]} 
                    id={`tab-content-${tab.id}`} 
                  />
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Card>
  );
};