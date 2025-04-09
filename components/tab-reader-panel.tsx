import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TabContentViewer } from "@/components/tab-content-viewer";
import { BrowserTab, getBrowserTabs } from "@/utils/browser-tabs";
import { readTab } from "@/utils/llm-message-formatter";
import { Book } from "lucide-react";
import { useChatSettings } from "@/components/ChatSettingsContext";

export function TabReaderPanel() {
  // Use our chat settings context
  const { 
    selectedTabs, 
    addSelectedTab, 
    removeSelectedTab, 
    toggleTabSelection, 
    selectedTabReader 
  } = useChatSettings();
  
  const [tabs, setTabs] = useState<BrowserTab[]>([]);
  const [currentTab, setCurrentTab] = useState<BrowserTab | null>(null);
  const [markdownContents, setMarkdownContents] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch browser tabs when component mounts
  useEffect(() => {
    fetchTabs();
  }, []);

  // Function to fetch browser tabs
  const fetchTabs = async () => {
    const fetchedTabs = await getBrowserTabs();
    setTabs(fetchedTabs.otherTabs);
    setCurrentTab(fetchedTabs.currentTab);
    
    // We no longer need to automatically select the current tab here since
    // that will be handled by the ChatSettings context
  };

  // Function to read tab content using the selected tab reader
  const readSelectedTabs = async () => {
    setIsLoading(true);
    
    const newMarkdownContents = { ...markdownContents };
    
    // Read current tab if selected
    if (currentTab && selectedTabs.includes(currentTab.id)) {
      try {
        // Pass the selected tab reader ID to readTab if needed
        const markdown = await readTab(currentTab.id, selectedTabReader.id);
        if (markdown) {
          newMarkdownContents[currentTab.id] = markdown;
        }
      } catch (error) {
        console.error(`Error reading current tab (${currentTab.id}):`, error);
      }
    }
    
    // Read other selected tabs
    for (const tabId of selectedTabs) {
      // Skip the current tab as we already processed it
      if (currentTab && tabId === currentTab.id) continue;
      
      // Skip tabs that have already been processed
      if (newMarkdownContents[tabId]) continue;
      
      try {
        // Pass the selected tab reader ID to readTab if needed
        const markdown = await readTab(tabId, selectedTabReader.id);
        if (markdown) {
          newMarkdownContents[tabId] = markdown;
        }
      } catch (error) {
        console.error(`Error reading tab ${tabId}:`, error);
      }
    }
    
    setMarkdownContents(newMarkdownContents);
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Tab Reader</h2>
        
        <div className="text-sm text-muted-foreground mb-3">
          Select tabs and click "Read Tabs" to convert their content to markdown using {selectedTabReader.name}.
        </div>
        
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {currentTab && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`tab-${currentTab.id}`}
                checked={selectedTabs.includes(currentTab.id)}
                onChange={() => toggleTabSelection(currentTab.id)}
                className="mr-2"
              />
              <label htmlFor={`tab-${currentTab.id}`} className="flex items-center text-sm">
                <span className="font-medium truncate">{currentTab.title}</span>
                <span className="ml-1 text-xs text-muted-foreground">(current)</span>
              </label>
            </div>
          )}
          
          {tabs.map(tab => (
            <div key={tab.id} className="flex items-center">
              <input
                type="checkbox"
                id={`tab-${tab.id}`}
                checked={selectedTabs.includes(tab.id)}
                onChange={() => toggleTabSelection(tab.id)}
                className="mr-2"
              />
              <label htmlFor={`tab-${tab.id}`} className="text-sm truncate">
                {tab.title}
              </label>
            </div>
          ))}
        </div>
        
        <Button 
          className="w-full mt-3" 
          onClick={readSelectedTabs}
          disabled={isLoading || selectedTabs.length === 0}
        >
          {isLoading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              Reading Tabs...
            </>
          ) : (
            <>
              <Book className="mr-2 h-4 w-4" />
              Read Tabs
            </>
          )}
        </Button>
      </Card>
      
      {Object.keys(markdownContents).length > 0 && (
        <TabContentViewer 
          markdownContents={markdownContents} 
          tabs={[...(currentTab ? [currentTab] : []), ...tabs]}
          currentTabId={currentTab?.id}
        />
      )}
    </div>
  );
}