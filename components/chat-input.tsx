"use client";

import { useRef, useEffect, useState } from "react";
import {
  Paperclip,
  ChevronDown,
  Globe,
  Check,
  SendHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "./ui/textarea";
import {
  BrowserTab,
  getBrowserTabs,
  getTabHighlightedText,
  subscribeToTabChanges,
  subscribeToHighlightChanges,
} from "@/utils/browser-tabs";
import { geminiModels, GeminiModel } from "@/utils/gemini-models";
import { TabDisplay } from "@/components/tab-display";
import { useChatSettings, tabReaders } from "@/components/ChatSettingsContext";
import { AnimatePresence, motion } from "framer-motion";
import { SearchToggleButton } from "@/components/search-toggle-button";

import { cn } from "/lib/utils";
import { DEFAULT_ACTIONS } from "@/utils/action-button";
// Font size variable
const FONT_SIZE = "xs"; // Options: xs, sm, base, lg, xl, etc.
const actions = DEFAULT_ACTIONS;

export default function ChatInput({
  onSubmit,
}: {
  onSubmit?: (data: {
    text: string;
    tabs: BrowserTab[];
    model: string;
    highlightedText: Record<number, string>;
    currentTabId: number | null;
  }) => void;
}) {
  // Use our centralized settings context
  const {
    selectedModel,
    selectedTabReader,
    useCurrentTab,
    selectedTabs,
    highlightedTabs,
    useSearch,
    setSelectedModel,
    setSelectedTabReader,
    setUseCurrentTab,
    setUseSearch,
    toggleTabSelection,
    removeSelectedTab,
    updateHighlightedTab,
  } = useChatSettings();

  // Local state for query and browser tabs
  const [query, setQuery] = useState("");
  const [tabs, setTabs] = useState<BrowserTab[]>([]);
  const [currentTab, setCurrentTab] = useState<BrowserTab | null>(null);
  const textareaRef = useRef(null);

  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const toggleItem = (itemText: string) => {
    // setSelectedItem((prev) => (prev === itemText ? null : itemText));
    setQuery(itemText);
  };

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = "auto";
      // Set the height to match the content (with a min height)
      const scrollHeight = Math.max(textarea.scrollHeight, 24);
      // Apply the height, but let CSS max-height handle the limit
      textarea.style.height = `${scrollHeight}px`;
    }
  };

  // Function to fetch browser tabs
  const handleFetchTabs = async () => {
    const fetchedTabs = await getBrowserTabs();
    setTabs(fetchedTabs.otherTabs);
    setCurrentTab(fetchedTabs.currentTab);
  };

  // Function to handle tab changes
  const handleTabChange = (tabsResult) => {
    setTabs(tabsResult.otherTabs);
    setCurrentTab(tabsResult.currentTab);
  };

  // Function to handle highlight changes
  const handleHighlightChange = (
    tabId: number,
    hasHighlight: boolean,
    highlightedText: string
  ) => {
    console.log("Highlight change:", tabId, hasHighlight, highlightedText);
    updateHighlightedTab(tabId, highlightedText);
  };

  // Fetch browser tabs when component mounts and subscribe to tab changes
  useEffect(() => {
    handleFetchTabs();

    // Initialize highlighted tabs state
    const initHighlightedTabs = async () => {
      if (currentTab) {
        const highlightedText = await getTabHighlightedText(currentTab.id);
        updateHighlightedTab(currentTab.id, highlightedText);
      }

      for (const tab of tabs) {
        const highlightedText = await getTabHighlightedText(tab.id);
        updateHighlightedTab(tab.id, highlightedText);
      }
    };

    initHighlightedTabs();

    // Subscribe to tab change events
    const unsubscribeTabChanges = subscribeToTabChanges(handleTabChange);

    // Subscribe to highlight change events
    const unsubscribeHighlightChanges = subscribeToHighlightChanges(
      handleHighlightChange
    );

    // Clean up subscriptions when component unmounts
    return () => {
      unsubscribeTabChanges();
      unsubscribeHighlightChanges();
    };
  }, []);

  // Adjust height when component mounts and when query changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [query]);

  const handleTextareaChange = (e) => {
    setQuery(e.target.value);
  };

  const handleModelSelect = (model: GeminiModel) => {
    setSelectedModel(model);
  };

  const handleTabReaderSelect = (reader) => {
    setSelectedTabReader(reader);
  };

  const handleSubmit = () => {
    if (!query.trim()) return; // Don't submit empty queries

    // Collect selected tab objects instead of just IDs
    const tabsToSubmit: BrowserTab[] = [];

    // Add selected tabs
    tabs.forEach((tab) => {
      if (selectedTabs.includes(tab.id)) {
        tabsToSubmit.push(tab);
      }
    });

    // Add current tab if it's being used
    if (currentTab && useCurrentTab) {
      tabsToSubmit.push(currentTab);
    }

    // Call the onSubmit prop with the query and selected tabs
    onSubmit?.({
      model: selectedModel.id,
      text: query.trim(),
      tabs: tabsToSubmit,
      highlightedText: highlightedTabs,
      currentTabId: currentTab?.id || null,
    });

    // Clear the input after submission
    setQuery("");
  };

  const handleKeyDown = (e) => {
    // Submit when Enter is pressed without Shift
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent new line
      handleSubmit();
    }
  };

  // Get selected tab objects
  const getSelectedTabObjects = () => {
    return tabs.filter((tab) => selectedTabs.includes(tab.id));
  };

  return (
    <div className="w-full mx-auto">
      <div className="flex flex-col border gap-0">
        {/*Action buttons*/}
        {/* {query === "" && (
          <div className="flex flex-wrap gap-1.5 p-1 border-b">
            {actions
              // .filter((item) => item.text !== selectedItem)
              .map(({ text, icon: Icon, colors }) => (
                <button
                  type="button"
                  key={text}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-full",
                    "border transition-all duration-200",
                    "border-black/10 dark:border-white/10 bg-white dark:bg-gray-900 hover:bg-black/5 dark:hover:bg-white/5",
                    "flex-shrink-0"
                  )}
                  onClick={() => toggleItem(text)}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className={`h-4 w-4 ${colors.icon}`} />
                    <span className="text-black/70 dark:text-white/70 whitespace-nowrap">
                      {text}
                    </span>
                  </div>
                </button>
              ))}
          </div>
        )} */}
        {/* Context rows */}
        {/* <div className="flex items-center gap-2"> */}
        <div className="flex items-center gap-2 p-1 flex-wrap">
          <DropdownMenu
            onOpenChange={(open) => {
              if (open) {
                handleFetchTabs();
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              <Button
                size={"no"}
                variant="ghost"
                className="flex items-center gap-2 py-1 px-1 gap-2 border rounded-lg hover:text-foreground hover:bg-muted  text-xs"
              >
                <Paperclip className="h-4 w-4" /> <p>Add Tabs...</p>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[300px] max-h-[400px] overflow-y-auto"
            >
              {tabs.length > 0 ? (
                tabs.map((tab) => (
                  <DropdownMenuItem
                    key={tab.id}
                    className={`flex items-center gap-2 text-${FONT_SIZE} py-2`}
                    onClick={() => toggleTabSelection(tab.id)}
                  >
                    <div className="w-4 h-4 flex items-center justify-center">
                      {selectedTabs.includes(tab.id) && (
                        <Check className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <div className="w-4 h-4 flex items-center justify-center">
                      {tab.favicon ? (
                        <img src={tab.favicon} alt="" className="h-3.5 w-3.5" />
                      ) : (
                        <Globe className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <span className="truncate">{tab.title}</span>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>No tabs available</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* </div> */}

          {/* <div className="flex items-center gap-2 py-1 flex-wrap"> */}
          {currentTab && (
            <TabDisplay
              tab={currentTab}
              isCurrentTab={true}
              useCurrentTab={useCurrentTab}
              onToggleVisibility={() => setUseCurrentTab(!useCurrentTab)}
              hasHighlight={highlightedTabs[currentTab.id]}
            />
          )}

          {/* Display selected tabs */}
          {getSelectedTabObjects().map((tab) => (
            <TabDisplay
              key={tab.id}
              tab={tab}
              onRemove={() => removeSelectedTab(tab.id)}
              hasHighlight={highlightedTabs[tab.id]}
            />
          ))}
        </div>

        {/* Input row */}
        <div className="w-full p-1">
          <Textarea
            ref={textareaRef}
            placeholder="What do you want to know?"
            value={query}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            rows={1}
            className={`w-full px-1 border-none bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 text-${FONT_SIZE} min-h-[24px] max-h-[500px] overflow-y-auto resize-none`}
            onInput={adjustTextareaHeight}
          />
        </div>

        {/* Buttons row */}
        <div className="flex items-center gap-2 justify-between p-1">
          <div>
            <SearchToggleButton
              enabled={useSearch}
              onToggle={() => setUseSearch(!useSearch)}
            />
          </div>
          <div className="flex items-center gap-2">
            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size={"no"}
                  className="hover:bg-muted/80 text-foreground rounded-full gap-0"
                >
                  <span className={`text-${FONT_SIZE}`}>
                    {selectedTabReader.name}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {tabReaders.map((reader) => (
                  <DropdownMenuItem
                    key={reader.id}
                    onClick={() => handleTabReaderSelect(reader)}
                    className={`${
                      selectedTabReader.id === reader.id ? "bg-muted" : ""
                    } text-${FONT_SIZE}`}
                  >
                    {reader.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu> */}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size={"no"}
                  className="hover:bg-muted/80 text-foreground rounded-full gap-0"
                >
                  <span className={`text-${FONT_SIZE}`}>
                    {selectedModel.name}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {geminiModels.map((model) => (
                  <TooltipProvider key={model.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuItem
                          onClick={() => handleModelSelect(model)}
                          className={`${
                            selectedModel.id === model.id ? "bg-muted" : ""
                          } text-${FONT_SIZE}`}
                        >
                          {model.name}
                        </DropdownMenuItem>
                      </TooltipTrigger>
                      <TooltipContent className="w-72 p-2 text-xs">
                        <p className="font-bold">{model.name}</p>
                        <p className="mt-1 text-muted-foreground italic">
                          {model.id}
                        </p>
                        <p className="mt-1">{model.description}</p>
                        <div className="mt-1 text-muted-foreground">
                          <p>Inputs: {model.inputs}</p>
                          <p>Outputs: {model.outputs}</p>
                        </div>
                        <div className="mt-1 text-muted-foreground">
                          <p>
                            Limits: {model.rateLimits.rpm} RPM /{" "}
                            {model.rateLimits.tpm} TPM
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="no"
              className="bg-muted h-5 w-5 hover:bg-muted/50 text-foreground rounded-full"
              onClick={handleSubmit}
            >
              <SendHorizontal className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
