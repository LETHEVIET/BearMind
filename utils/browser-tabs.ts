import { debounce } from 'lodash';

export interface BrowserTab {
  id: number;
  title: string;
  favicon?: string;
  url?: string;
}

export interface BrowserTabsResult {
  currentTabId: number;
  tabs: Record<number,BrowserTab>;
}

// Define event callback types
export type TabChangeCallback = (result: BrowserTabsResult) => void;
export type HighlightChangeCallback = (tabId: number, hasHighlight: boolean, highlightedText: string) => void;
const highlightChangeListeners: Set<HighlightChangeCallback> = new Set();

// Store for active event listeners
const tabChangeListeners: Set<TabChangeCallback> = new Set();

/**
 * Get all tabs currently open in the browser.
 * Note: This function only works in a browser extension context with proper permissions.
 * @returns Promise with the current tab and an array of other browser tabs
 */
export async function getBrowserTabs(): Promise<BrowserTabsResult> {
  // Check if browser extension APIs are available
  
  if (typeof browser !== 'undefined' && browser.tabs) {
    try {
      // Using Firefox extension API
      const allTabs = await browser.tabs.query({ currentWindow: true });
      const currentTabs = await browser.tabs.query({ active: true, currentWindow: true });
      const currentTab = currentTabs.length > 0 ? mapTabToBrowserTab(currentTabs[0]) : null;
      const currentTabId = currentTab ? currentTab.id : 0;

      const tabs: Record<number, BrowserTab> = {};

      for (const tab of allTabs) {
          tabs[tab.id? tab.id : 0] = mapTabToBrowserTab(tab);
      }
      
      return { currentTabId, tabs };
    } catch (error) {
      console.error('Failed to get browser tabs:', error);
      return getFallbackTabs();
    }
  }
  
  // Return mock data in environments without browser extension APIs
  return getFallbackTabs();
}

/**
 * Map browser tab to BrowserTab interface
 */
function mapTabToBrowserTab(tab: any): BrowserTab {
  return {
    id: tab.id || 0,
    title: tab.title || 'Untitled Tab',
    favicon: tab.favIconUrl,
    url: tab.url
  };
}

/**
 * Get fallback tabs for testing or when browser APIs are unavailable
 */
function getFallbackTabs(): BrowserTabsResult {
  const mockTabs = [
    { id: 1, title: "GitHub - Build software better, together", favicon: "github.com", url: "https://github.com" },
    { id: 2, title: "Stack Overflow - Where Developers Learn & Share", favicon: "stackoverflow.com", url: "https://stackoverflow.com" },
    { id: 3, title: "React - A JavaScript library for building user interfaces", favicon: "reactjs.org", url: "https://reactjs.org" },
    { id: 4, title: "Next.js by Vercel - The React Framework", favicon: "nextjs.org", url: "https://nextjs.org" },
    { id: 5, title: "Tailwind CSS - Rapidly build modern websites", favicon: "tailwindcss.com", url: "https://tailwindcss.com" },
  ];
  
  // Create a record of tabs with their IDs as keys
  const tabs: Record<number, BrowserTab> = {};
  mockTabs.forEach(tab => {
    tabs[tab.id] = tab;
  });
  
  // Pretend the first tab is active
  return {
    currentTabId: mockTabs[0].id,
    tabs
  };
}

/**
 * Subscribe to tab change events (created, updated, removed, activated)
 * @param callback Function to call when tabs change
 * @returns Function to unsubscribe from events
 */
export function subscribeToTabChanges(callback: TabChangeCallback): () => void {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    // Add the callback to our listeners
    tabChangeListeners.add(callback);
    
    // Set up event listeners if this is the first subscriber
    if (tabChangeListeners.size === 1) {
      setupChromeTabListeners();
    }
    
    // Return unsubscribe function
    return () => {
      tabChangeListeners.delete(callback);
      
      // Remove event listeners if no subscribers remain
      if (tabChangeListeners.size === 0) {
        removeTabListeners();
      }
    };
  } else if (typeof browser !== 'undefined' && browser.tabs) {
    // Add the callback to our listeners
    tabChangeListeners.add(callback);
    
    // Set up event listeners if this is the first subscriber
    if (tabChangeListeners.size === 1) {
      setupFirefoxTabListeners();
    }
    
    // Return unsubscribe function
    return () => {
      tabChangeListeners.delete(callback);
      
      // Remove event listeners if no subscribers remain
      if (tabChangeListeners.size === 0) {
        removeTabListeners();
      }
    };
  }
  
  // In environments without browser APIs, set up a mock interval
  // that occasionally changes the mock tabs
  const intervalId = setInterval(async () => {
    const tabs = await getBrowserTabs();
    callback(tabs);
  }, 10000); // Every 10 seconds
  
  return () => clearInterval(intervalId);
}

/**
 * Notify all subscribers of tab changes
 */
async function notifyTabChangeListeners() {
  const tabs = await getBrowserTabs();
  tabChangeListeners.forEach(callback => callback(tabs));
}

/**
 * Set up Chrome tab event listeners
 */
function setupChromeTabListeners() {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.onCreated.addListener(() => notifyTabChangeListeners());
    chrome.tabs.onUpdated.addListener(() => notifyTabChangeListeners());
    chrome.tabs.onRemoved.addListener(() => notifyTabChangeListeners());
    chrome.tabs.onActivated.addListener(() => notifyTabChangeListeners());
  }
}

/**
 * Set up Firefox tab event listeners
 */
function setupFirefoxTabListeners() {
  if (typeof browser !== 'undefined' && browser.tabs) {
    browser.tabs.onCreated.addListener(() => notifyTabChangeListeners());
    browser.tabs.onUpdated.addListener(() => notifyTabChangeListeners());
    browser.tabs.onRemoved.addListener(() => notifyTabChangeListeners());
    browser.tabs.onActivated.addListener(() => notifyTabChangeListeners());
  }
}

/**
 * Remove all tab event listeners
 */
function removeTabListeners() {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.onCreated.removeListener(() => notifyTabChangeListeners());
    chrome.tabs.onUpdated.removeListener(() => notifyTabChangeListeners());
    chrome.tabs.onRemoved.removeListener(() => notifyTabChangeListeners());
    chrome.tabs.onActivated.removeListener(() => notifyTabChangeListeners());
  } else if (typeof browser !== 'undefined' && browser.tabs) {
    browser.tabs.onCreated.removeListener(() => notifyTabChangeListeners());
    browser.tabs.onUpdated.removeListener(() => notifyTabChangeListeners());
    browser.tabs.onRemoved.removeListener(() => notifyTabChangeListeners());
    browser.tabs.onActivated.removeListener(() => notifyTabChangeListeners());
  }
}

/**
 * Get the currently highlighted text in a specific browser tab
 * Note: This function only works in a browser extension context with proper permissions.
 * @param tabId The ID of the tab to get highlighted text from
 * @returns Promise with the highlighted text, or empty string if none
 */
export async function getTabHighlightedText(tabId: number): Promise<string> {
  // More robust script to execute in the tab that gets any highlighted text
  const getSelectionScript = `
    (function() {
      // More robust selection getting that handles different contexts
      try {
        // Get selection from the main window
        let selection = window.getSelection();
        let text = selection ? selection.toString() : "";
        
        // If no text selected, try getting from active elements (like inputs)
        if (!text && document.activeElement) {
          const el = document.activeElement;
          if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            const start = el.selectionStart;
            const end = el.selectionEnd;
            if (start !== null && end !== null && start !== end) {
              text = el.value.substring(start, end);
            }
          }
        }
        
        return text;
      } catch (e) {
        console.error("Error getting selection:", e);
        return "";
      }
    })();
  `;
  
  // Check if browser extension APIs are available
  if (typeof chrome !== 'undefined' && chrome.scripting) {
    try {
      // Using Chrome extension API
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          try {
            // Get selection from the main window
            let selection = window.getSelection();
            let text = selection ? selection.toString() : "";
            
            // If no text selected, try getting from active elements (like inputs)
            if (!text && document.activeElement) {
              const el = document.activeElement;
              if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
                const start = el.selectionStart;
                const end = el.selectionEnd;
                if (start !== null && end !== null && start !== end) {
                  text = el.value.substring(start, end);
                }
              }
            }
            
            return text;
          } catch (e) {
            console.error("Error getting selection:", e);
            return "";
          }
        },
      });
      return results[0]?.result || "";
    } catch (error) {
      console.error('Failed to get highlighted text from Chrome tab:', error);
      return "";
    }
  } else if (typeof browser !== 'undefined' && browser.tabs) {
    try {
      // Using Firefox extension API
      const results = await browser.tabs.executeScript(tabId, {
        code: getSelectionScript
      });
      return results[0] || "";
    } catch (error) {
      console.error('Failed to get highlighted text from Firefox tab:', error);
      return "";
    }
  }
  
  // Return empty string in environments without browser extension APIs
  console.log('Browser APIs not available for getting highlighted text');
  return "";
}

/**
 * Subscribe to text highlight changes in browser tabs
 * @param callback Function to call when highlighted text changes in any tab
 * @returns Function to unsubscribe from events
 */
export function subscribeToHighlightChanges(callback: HighlightChangeCallback): () => void {
  // Add the callback to our listeners
  highlightChangeListeners.add(callback);
  
  // Set up polling if this is the first subscriber
  if (highlightChangeListeners.size === 1) {
    setupHighlightMonitoring();
  }
  
  // Return unsubscribe function
  return () => {
    highlightChangeListeners.delete(callback);
    
    // Remove monitoring if no subscribers remain
    if (highlightChangeListeners.size === 0) {
      removeHighlightMonitoring();
    }
  };
}

// Store for current highlight state and the interval ID
let highlightState: Record<number, {hasHighlight: boolean, text: string}> = {};
let highlightMonitorIntervalId: NodeJS.Timeout | null = null;
let activeTabIntervalId: NodeJS.Timeout | null = null;

/**
 * Set up monitoring for text highlighting in tabs
 */
function setupHighlightMonitoring() {
  // Clear any existing intervals
  if (highlightMonitorIntervalId) {
    clearInterval(highlightMonitorIntervalId);
  }
  
  if (activeTabIntervalId) {
    clearInterval(activeTabIntervalId);
  }
  
  // Initialize with empty state
  highlightState = {};
  
  // Set up an interval to check for highlighted text in active tab more frequently
  activeTabIntervalId = setInterval(async () => {
    // Get active tab
    const { currentTabId, tabs } = await getBrowserTabs();
    if (currentTabId) {
      try {
        const highlightedText = await getTabHighlightedText(currentTabId);
        const hasHighlight = !!highlightedText;
        
        // Check if highlight state or text content changed
        const currentState = highlightState[currentTabId];
        const stateChanged = !currentState || 
                             currentState.hasHighlight !== hasHighlight ||
                             (hasHighlight && currentState.text !== highlightedText);
                             
        if (stateChanged) {
          highlightState[currentTabId] = { hasHighlight, text: highlightedText };
          notifyHighlightChangeListeners(currentTabId, hasHighlight, highlightedText);
        }
      } catch (error) {
        console.error(`Failed to check highlight for active tab:`, error);
      }
    }
  }, 200); // Check active tab every 200ms
  
  // Set up an interval to check for highlighted text in all tabs
  highlightMonitorIntervalId = setInterval(async () => {
    // Get all tabs
    const { currentTabId, tabs } = await getBrowserTabs();
    
    // Only check other tabs (active tab is handled separately)
    for (const tabid of Object.keys(tabs)) {
      const tab_id = parseInt(tabid, 0);
      if (tab_id === currentTabId) continue; // Skip active tab
      try {
        const highlightedText = await getTabHighlightedText(tab_id);
        const hasHighlight = !!highlightedText;
        
        // Check if highlight state or text content changed
        const currentState = highlightState[tab_id];
        const stateChanged = !currentState || 
                             currentState.hasHighlight !== hasHighlight ||
                             (hasHighlight && currentState.text !== highlightedText);
                             
        if (stateChanged) {
          highlightState[tab_id] = { hasHighlight, text: highlightedText };
          notifyHighlightChangeListeners(tab_id, hasHighlight, highlightedText);
        }
      } catch (error) {
        console.error(`Failed to check highlight for tab ${tab_id}:`, error);
      }
    }
  }, 1000); // Check other tabs once per second
}

/**
 * Clean up highlight monitoring
 */
function removeHighlightMonitoring() {
  if (highlightMonitorIntervalId) {
    clearInterval(highlightMonitorIntervalId);
    highlightMonitorIntervalId = null;
  }
  if (activeTabIntervalId) {
    clearInterval(activeTabIntervalId);
    activeTabIntervalId = null;
  }
  highlightState = {};
}

/**
 * Notify all subscribers of highlight changes, debounced to prevent rapid-fire events
 */
const notifyHighlightChangeListeners = debounce((tabId: number, hasHighlight: boolean, highlightedText: string) => {
  highlightChangeListeners.forEach(callback => callback(tabId, hasHighlight, highlightedText));
}, 150); // Wait 150ms after last change before notifying
