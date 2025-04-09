export interface BrowserTab {
  id: number;
  title: string;
  favicon?: string;
  url?: string;
}

export interface BrowserTabsResult {
  currentTab: BrowserTab | null;
  otherTabs: BrowserTab[];
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
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    try {
      // Using Chrome extension API
      const allTabs = await chrome.tabs.query({ currentWindow: true });
      const currentTabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = currentTabs.length > 0 ? mapTabToBrowserTab(currentTabs[0]) : null;
      
      const otherTabs = allTabs
        .filter(tab => !currentTab || tab.id !== currentTab.id)
        .map(mapTabToBrowserTab);
      
      return { currentTab, otherTabs };
    } catch (error) {
      console.error('Failed to get browser tabs:', error);
      return getFallbackTabs();
    }
  } else if (typeof browser !== 'undefined' && browser.tabs) {
    try {
      // Using Firefox extension API
      const allTabs = await browser.tabs.query({ currentWindow: true });
      const currentTabs = await browser.tabs.query({ active: true, currentWindow: true });
      const currentTab = currentTabs.length > 0 ? mapTabToBrowserTab(currentTabs[0]) : null;
      
      const otherTabs = allTabs
        .filter(tab => !currentTab || tab.id !== currentTab.id)
        .map(mapTabToBrowserTab);
      
      return { currentTab, otherTabs };
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
  
  // Pretend the first tab is active
  return {
    currentTab: mockTabs[0],
    otherTabs: mockTabs.slice(1)
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
  // Script to execute in the tab that gets any highlighted text
  const getSelectionScript = `
    (function() {
      return window.getSelection().toString();
    })();
  `;
  
  // Check if browser extension APIs are available
  if (typeof chrome !== 'undefined' && chrome.scripting) {
    try {
      // Using Chrome extension API
      const results = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => window.getSelection()?.toString() || "",
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
let highlightState: Record<number, boolean> = {};
let highlightMonitorIntervalId: NodeJS.Timeout | null = null;

/**
 * Set up monitoring for text highlighting in tabs
 */
function setupHighlightMonitoring() {
  // Clear any existing interval
  if (highlightMonitorIntervalId) {
    clearInterval(highlightMonitorIntervalId);
  }
  
  // Initialize with empty state
  highlightState = {};
  
  // Set up an interval to check for highlighted text in all tabs
  highlightMonitorIntervalId = setInterval(async () => {
    // Get all tabs
    const { currentTab, otherTabs } = await getBrowserTabs();
    const allTabs = [...(currentTab ? [currentTab] : []), ...otherTabs];
    
    // Check each tab for highlighted text
    for (const tab of allTabs) {
      try {
        const highlightedText = await getTabHighlightedText(tab.id);
        const hasHighlight = !!highlightedText;
        
        // If the highlight state has changed, notify listeners
        if (highlightState[tab.id] !== hasHighlight) {
          highlightState[tab.id] = hasHighlight;
          notifyHighlightChangeListeners(tab.id, hasHighlight, highlightedText);
        }
      } catch (error) {
        console.error(`Failed to check highlight for tab ${tab.id}:`, error);
      }
    }
  }, 1000); // Check once per second
}

/**
 * Clean up highlight monitoring
 */
function removeHighlightMonitoring() {
  if (highlightMonitorIntervalId) {
    clearInterval(highlightMonitorIntervalId);
    highlightMonitorIntervalId = null;
  }
  highlightState = {};
}

/**
 * Notify all subscribers of highlight changes
 */
function notifyHighlightChangeListeners(tabId: number, hasHighlight: boolean, highlightedText: string) {
  highlightChangeListeners.forEach(callback => callback(tabId, hasHighlight, highlightedText));
}
