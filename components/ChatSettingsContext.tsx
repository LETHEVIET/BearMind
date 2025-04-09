import React, { createContext, useState, useContext, useEffect } from 'react';
import { GeminiModel, getModelById } from "@/utils/gemini-models";
import { browser } from "wxt/browser";

// Define the tab reader type
export interface TabReader {
  id: string;
  name: string;
}

// Default tab readers
export const tabReaders: TabReader[] = [
  {
    id: "dom2md",
    name: "DOM to Markdown",
  },
  {
    id: "gemini-2.0-flash-exp",
    name: "LLM reader",
  },
];

// Define the structure of our chat settings
export interface ChatSettings {
  // Model settings
  selectedModel: GeminiModel;
  selectedTabReader: TabReader;
  
  // API Key settings
  apiKey: string;
  
  // Tab settings
  useCurrentTab: boolean;
  selectedTabs: number[];
  highlightedTabs: Record<number, string>;
  
  // Search settings
  useSearch: boolean;
  
  // State setters
  setSelectedModel: (model: GeminiModel) => void;
  setSelectedTabReader: (reader: TabReader) => void;
  setApiKey: (key: string) => void;
  setUseCurrentTab: (use: boolean) => void;
  setSelectedTabs: (tabs: number[]) => void;
  setHighlightedTabs: (tabs: Record<number, string>) => void;
  setUseSearch: (use: boolean) => void;
  
  // Utility functions
  addSelectedTab: (tabId: number) => void;
  removeSelectedTab: (tabId: number) => void;
  toggleTabSelection: (tabId: number) => void;
  updateHighlightedTab: (tabId: number, highlightedText: string) => void;
}

// Create the context with a default value
const ChatSettingsContext = createContext<ChatSettings | undefined>(undefined);

// Create a provider component
export const ChatSettingsProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize state for all settings
  const [selectedModel, setSelectedModel] = useState<GeminiModel>(
    getModelById("gemini-2.0-flash-exp") || {
      id: "gemini-2.0-flash-exp",
      name: "Gemini 2.0 Flash Experimental",
      inputs: "",
      outputs: "",
      description: "",
      rateLimits: { rpm: 0, tpm: 0, rpd: 0 }
    }
  );
  const [selectedTabReader, setSelectedTabReader] = useState<TabReader>(tabReaders[0]);
  const [apiKey, setApiKey] = useState<string>("");
  const [useCurrentTab, setUseCurrentTab] = useState<boolean>(true);
  const [selectedTabs, setSelectedTabs] = useState<number[]>([]);
  const [highlightedTabs, setHighlightedTabs] = useState<Record<number, string>>({});
  const [useSearch, setUseSearch] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize settings from local storage if available
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await browser.storage.local.get(['chatSettings', 'geminiApiKey']);
        console.log('Loaded settings:', data);
        
        if (data.chatSettings) {
          const settings = JSON.parse(data.chatSettings);
          
          // Only set values that exist in storage to avoid overriding defaults
          if (settings.selectedModelId) {
            const model = getModelById(settings.selectedModelId);
            if (model) setSelectedModel(model);
          }
          
          if (settings.selectedTabReaderId) {
            const reader = tabReaders.find(r => r.id === settings.selectedTabReaderId);
            if (reader) setSelectedTabReader(reader);
          }
          
          if (settings.hasOwnProperty('useSearch')) {
            setUseSearch(settings.useSearch);
          }
        }

        // Load API key separately
        if (data.geminiApiKey) {
          setApiKey(data.geminiApiKey);
        }
      } catch (error) {
        console.error('Error loading chat settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Save settings to local storage when they change
  useEffect(() => {
    if (isLoading) return; // Prevent saving while loading

    const saveSettings = async () => {
      try {
        const settingsToSave = {
          selectedModelId: selectedModel.id,
          selectedTabReaderId: selectedTabReader.id,
          useSearch: useSearch,
          // Removed useCurrentTab, selectedTabs, and highlightedTabs from being saved
        };
        console.log('settingsToSave', settingsToSave);
        
        await browser.storage.local.set({
          chatSettings: JSON.stringify(settingsToSave)
        });
      } catch (error) {
        console.error('Error saving chat settings:', error);
      }
    };
    
    saveSettings();
  }, [selectedModel, selectedTabReader, useSearch, isLoading]);

  // Save API key to local storage when it changes
  useEffect(() => {
    if (isLoading) return; // Prevent saving while loading

    const saveApiKey = async () => {
      try {
        if (apiKey) { // Only save if there is an API key to save
          await browser.storage.local.set({ geminiApiKey: apiKey });
        }
      } catch (error) {
        console.error('Error saving API key:', error);
      }
    };
    
    saveApiKey();
  }, [apiKey, isLoading]);

  // Helper functions for tab management
  const addSelectedTab = (tabId: number) => {
    if (!selectedTabs.includes(tabId)) {
      setSelectedTabs([...selectedTabs, tabId]);
    }
  };

  const removeSelectedTab = (tabId: number) => {
    setSelectedTabs(selectedTabs.filter(id => id !== tabId));
  };

  const toggleTabSelection = (tabId: number) => {
    if (selectedTabs.includes(tabId)) {
      removeSelectedTab(tabId);
    } else {
      addSelectedTab(tabId);
    }
  };

  const updateHighlightedTab = (tabId: number, highlightedText: string) => {
    setHighlightedTabs(prev => ({
      ...prev,
      [tabId]: highlightedText
    }));
  };

  // Provide all settings and functions to children
  const value = {
    selectedModel,
    selectedTabReader,
    apiKey,
    useCurrentTab,
    selectedTabs,
    highlightedTabs,
    useSearch,
    setSelectedModel,
    setSelectedTabReader,
    setApiKey,
    setUseCurrentTab,
    setSelectedTabs,
    setHighlightedTabs,
    setUseSearch,
    addSelectedTab,
    removeSelectedTab,
    toggleTabSelection,
    updateHighlightedTab
  };

  return (
    <ChatSettingsContext.Provider value={value}>
      {children}
    </ChatSettingsContext.Provider>
  );
};

// Custom hook to use the settings context
export const useChatSettings = (): ChatSettings => {
  const context = useContext(ChatSettingsContext);
  if (context === undefined) {
    throw new Error('useChatSettings must be used within a ChatSettingsProvider');
  }
  return context;
};