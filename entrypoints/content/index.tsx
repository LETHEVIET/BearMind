import "./style.css";
import ReactDOM from "react-dom/client";
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

export default defineContentScript({
  matches: ["*://*/*"],
  cssInjectionMode: "ui",
  async main(ctx) {
    // Remove or comment out the UI mounting code
    // Just keep the message listener functionality
    console.log("Content script loaded without UI");
  },
});
