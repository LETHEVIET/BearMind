import { browser } from "wxt/browser";

// Listen for messages from the extension
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getPageContent") {
    // Get the page HTML content
    const content = document.documentElement.outerHTML;
    sendResponse(content);
    return true; // Important for async response
  }
});

console.log("Content script loaded");
