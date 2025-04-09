import React, { useEffect, useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Card } from "@/components/ui/card";
import { TabContentViewer } from "@/components/tab-content-viewer";
import { BrowserTab, getBrowserTabs } from "@/utils/browser-tabs";
import { Book } from "lucide-react";
import { browser } from "wxt/browser";

interface ConvertedTabsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  convertedTabIds: number[];
}

export function ConvertedTabsDrawer({ 
  open, 
  onOpenChange, 
  convertedTabIds 
}: ConvertedTabsDrawerProps) {
  const [tabs, setTabs] = useState<BrowserTab[]>([]);
  const [currentTab, setCurrentTab] = useState<BrowserTab | null>(null);
  const [markdownContents, setMarkdownContents] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch browser tabs and converted content when component mounts or when convertedTabIds changes
  useEffect(() => {
    if (open && convertedTabIds.length > 0) {
      fetchTabsAndContent();
    }
  }, [open, convertedTabIds]);

  // Function to fetch browser tabs and content
  const fetchTabsAndContent = async () => {
    setIsLoading(true);
    try {
      // Get browser tabs
      const fetchedTabs = await getBrowserTabs();
      setTabs(fetchedTabs.otherTabs);
      setCurrentTab(fetchedTabs.currentTab);
      
      // Get content for converted tabs
      const contents: Record<number, string> = {};
      
      // We need to fetch the converted markdown content for each tab
      // For this example, we'll retrieve it from storage
      // In a real implementation, you might have this stored in a context or state manager
      const result = await browser.storage.local.get(
        convertedTabIds.map(id => `tab-content-${id}`)
      );
      
      for (const tabId of convertedTabIds) {
        const content = result[`tab-content-${tabId}`];
        if (content) {
          contents[tabId] = content;
        }
      }
      
      setMarkdownContents(contents);
    } catch (error) {
      console.error("Error fetching tabs and content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // All tabs, including current tab
  const allTabs = currentTab ? [currentTab, ...tabs] : tabs;

  return (
    <Drawer open={open} onOpenChange={onOpenChange} side="right">
      <div className="flex flex-col h-full">
        <div className="flex items-center mb-4">
          <Book className="mr-2 h-5 w-5" />
          <h2 className="text-lg font-semibold">Converted Tabs</h2>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : convertedTabIds.length === 0 ? (
          <Card className="p-4 text-center text-muted-foreground">
            No tabs have been converted to markdown yet.
          </Card>
        ) : Object.keys(markdownContents).length === 0 ? (
          <Card className="p-4 text-center text-muted-foreground">
            Content for converted tabs not found. Try selecting and reading tabs again.
          </Card>
        ) : (
          <div className="flex-1 overflow-hidden">
            <TabContentViewer 
              markdownContents={markdownContents} 
              tabs={allTabs}
              currentTabId={currentTab?.id}
            />
          </div>
        )}
      </div>
    </Drawer>
  );
}