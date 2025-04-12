import React, { createContext, useContext, useState, useEffect } from 'react';
import { browser } from "wxt/browser";
import { GeminiModel, getModelById } from "@/utils/gemini-models";
import { tabReaders, TabReader} from "@/components/ChatSettingsContext";
import { useTranslation } from "react-i18next";

// Define all the context sections
interface UISettings {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  language: string;
}

interface SessionData {
  selectedModel: GeminiModel;
  selectedTabReader: TabReader;
  apiKey: string;
  useCurrentTab: boolean;
  selectedTabs: number[];
  highlightedTabs: Record<number, string>;
  useSearch: boolean;
  convertedTabIds: number[];
}

interface AppContextType {
  ui: UISettings;
  session: SessionData;
  
  // UI actions
  setTheme: (theme: 'light' | 'dark') => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setLanguage: (lang: string) => void;
  
  // Session actions
  setSelectedModel: (model: GeminiModel) => void;
  setSelectedTabReader: (reader: TabReader) => void;
  setApiKey: (key: string) => void;
  setUseCurrentTab: (use: boolean) => void;
  setSelectedTabs: (tabs: number[]) => void;
  updateHighlightedTab: (tabId: number, highlightedText: string) => void;
  setUseSearch: (use: boolean) => void;
  toggleTabSelection: (tabId: number) => void;
  addConvertedTabId: (tabId: number) => void;
  removeConvertedTabId: (tabId: number) => void;
  resetSession: () => void;
}

// Create context with a default undefined value
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export const AppContextProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { i18n } = useTranslation();
  
  // Initialize state with default values
  const [uiSettings, setUISettings] = useState<UISettings>({
    theme: 'light',
    fontSize: 'medium',
    language: 'en'
  });
  
  const [sessionData, setSessionData] = useState<SessionData>({
    selectedModel: getModelById("gemini-2.0-flash-exp") || {
      id: "gemini-2.0-flash-exp",
      name: "Gemini 2.0 Flash Experimental",
      inputs: "",
      outputs: "",
      description: "",
      rateLimits: { rpm: 0, tpm: 0, rpd: 0 }
    },
    selectedTabReader: tabReaders[0],
    apiKey: "",
    useCurrentTab: true,
    selectedTabs: [],
    highlightedTabs: {},
    useSearch: true,
    convertedTabIds: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  
  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await browser.storage.local.get([
          'appSettings', 
          'chatSettings', 
          'geminiApiKey',
          'theme',
          'i18n',
          'uiSettings'
        ]);
        
        // Load UI settings
        if (data.uiSettings) {
          try {
            const uiData = JSON.parse(data.uiSettings);
            setUISettings(prevSettings => ({
              ...prevSettings,
              ...uiData
            }));
          } catch (e) {
            console.error('Error parsing UI settings:', e);
          }
        }
        
        // Load theme separately (for backward compatibility)
        if (data.theme) {
          setUISettings(prev => ({ ...prev, theme: data.theme }));
        }
        
        // Load language separately (for backward compatibility)
        if (data.i18n) {
          setUISettings(prev => ({ ...prev, language: data.i18n }));
        }
        
        // Load session data (previously chat settings)
        if (data.chatSettings) {
          try {
            const sessionSettings = JSON.parse(data.chatSettings);
            if (sessionSettings.selectedModelId) {
              const model = getModelById(sessionSettings.selectedModelId);
              if (model) {
                setSessionData(prev => ({...prev, selectedModel: model}));
              }
            }
            
            if (sessionSettings.selectedTabReaderId) {
              const reader = tabReaders.find(r => r.id === sessionSettings.selectedTabReaderId);
              if (reader) {
                setSessionData(prev => ({...prev, selectedTabReader: reader}));
              }
            }
            
            if (sessionSettings.hasOwnProperty('useSearch')) {
              setSessionData(prev => ({...prev, useSearch: sessionSettings.useSearch}));
            }
          } catch (e) {
            console.error('Error parsing chat settings:', e);
          }
        }
        
        // Load API key
        if (data.geminiApiKey) {
          setSessionData(prev => ({...prev, apiKey: data.geminiApiKey}));
        }
        
        // Load app settings (for converted tab IDs, etc.)
        if (data.appSettings) {
          try {
            const appData = JSON.parse(data.appSettings);
            if (appData.convertedTabIds) {
              setSessionData(prev => ({
                ...prev,
                convertedTabIds: appData.convertedTabIds
              }));
            }
          } catch (e) {
            console.error('Error parsing app settings:', e);
          }
        }
      } catch (error) {
        console.error('Error loading app context settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);
  
  // Save UI settings when they change
  useEffect(() => {
    if (isLoading) return;
    
    const saveUISettings = async () => {
      try {
        // Save full UI settings object
        await browser.storage.local.set({
          uiSettings: JSON.stringify(uiSettings)
        });
        
        // Also save individual settings for backward compatibility
        await browser.storage.local.set({ 
          theme: uiSettings.theme,
          i18n: uiSettings.language
        });
      } catch (error) {
        console.error('Error saving UI settings:', error);
      }
    };
    
    saveUISettings();
  }, [uiSettings, isLoading]);
  
  // Save session settings when they change
  useEffect(() => {
    if (isLoading) return;
    
    const saveSessionSettings = async () => {
      try {
        // Save session data that should persist
        const sessionToSave = {
          selectedModelId: sessionData.selectedModel.id,
          selectedTabReaderId: sessionData.selectedTabReader.id,
          useSearch: sessionData.useSearch,
        };
        
        await browser.storage.local.set({
          chatSettings: JSON.stringify(sessionToSave)
        });
        
        // Save API key separately
        if (sessionData.apiKey) {
          await browser.storage.local.set({
            geminiApiKey: sessionData.apiKey
          });
        }
        
        // Save app settings for converted tabs
        await browser.storage.local.set({
          appSettings: JSON.stringify({
            convertedTabIds: sessionData.convertedTabIds
          })
        });
      } catch (error) {
        console.error('Error saving session settings:', error);
      }
    };
    
    saveSessionSettings();
  }, [sessionData, isLoading]);
  
  // UI Actions
  const setTheme = (theme: 'light' | 'dark') => {
    setUISettings(prev => ({...prev, theme}));
    // Also notify other parts of the extension about theme change
    browser.runtime.sendMessage({
      messageType: "changeTheme",
      content: theme
    }).catch(err => console.error('Error sending theme message:', err));
  };
  
  const setFontSize = (fontSize: 'small' | 'medium' | 'large') => {
    setUISettings(prev => ({...prev, fontSize}));
    
    // Notify other parts of the extension about font size change
    browser.runtime.sendMessage({
      messageType: "changeFontSize",
      content: fontSize
    }).catch(err => console.error('Error sending font size message:', err));
  };
  
  const setLanguage = (language: string) => {
    setUISettings(prev => ({...prev, language}));
    i18n.changeLanguage(language);
    // Also notify other parts of the extension about language change
    browser.runtime.sendMessage({
      messageType: "changeLocale",
      content: language
    }).catch(err => console.error('Error sending locale message:', err));
  };
  
  // Session Actions
  const setSelectedModel = (selectedModel: GeminiModel) => {
    setSessionData(prev => ({...prev, selectedModel}));
  };
  
  const setSelectedTabReader = (selectedTabReader: TabReader) => {
    setSessionData(prev => ({...prev, selectedTabReader}));
  };
  
  const setApiKey = (apiKey: string) => {
    setSessionData(prev => ({...prev, apiKey}));
  };
  
  const setUseCurrentTab = (useCurrentTab: boolean) => {
    setSessionData(prev => ({...prev, useCurrentTab}));
  };
  
  const setSelectedTabs = (selectedTabs: number[]) => {
    setSessionData(prev => ({...prev, selectedTabs}));
  };
  
  const updateHighlightedTab = (tabId: number, highlightedText: string) => {
    setSessionData(prev => ({
      ...prev, 
      highlightedTabs: {
        ...prev.highlightedTabs,
        [tabId]: highlightedText
      }
    }));
  };
  
  const setUseSearch = (useSearch: boolean) => {
    setSessionData(prev => ({...prev, useSearch}));
  };
  
  const toggleTabSelection = (tabId: number) => {
    setSessionData(prev => {
      if (prev.selectedTabs.includes(tabId)) {
        return {
          ...prev,
          selectedTabs: prev.selectedTabs.filter(id => id !== tabId)
        };
      } else {
        return {
          ...prev,
          selectedTabs: [...prev.selectedTabs, tabId]
        };
      }
    });
  };
  
  const addConvertedTabId = (tabId: number) => {
    setSessionData(prev => {
      if (!prev.convertedTabIds.includes(tabId)) {
        return {
          ...prev,
          convertedTabIds: [...prev.convertedTabIds, tabId]
        };
      }
      return prev;
    });
  };
  
  const removeConvertedTabId = (tabId: number) => {
    setSessionData(prev => ({
      ...prev,
      convertedTabIds: prev.convertedTabIds.filter(id => id !== tabId)
    }));
  };
  
  const resetSession = () => {
    setSessionData(prev => ({
      ...prev,
      selectedTabs: [],
      highlightedTabs: {},
      convertedTabIds: []
    }));
  };
  
  const value = {
    ui: uiSettings,
    session: sessionData,
    
    // UI actions
    setTheme,
    setFontSize,
    setLanguage,
    
    // Session actions
    setSelectedModel,
    setSelectedTabReader,
    setApiKey,
    setUseCurrentTab,
    setSelectedTabs,
    updateHighlightedTab,
    setUseSearch,
    toggleTabSelection,
    addConvertedTabId,
    removeConvertedTabId,
    resetSession
  };
  
  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use the app context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};