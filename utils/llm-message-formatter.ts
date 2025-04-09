import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText, streamText } from "ai";
import { BrowserTab } from "./browser-tabs";
import { readMarkdownPrompt } from "./prompts";
import { CoreMessage, Message, TextStream } from "ai";
import { browser } from "wxt/browser";
import { toast } from "../hooks/use-toast";

// GoogleAI class to manage AI model creation and API keys
export class GoogleAI {
  private apiKey: string | (() => Promise<string>);
  private defaultModel: string;

  constructor(apiKey?: string, defaultModel = "gemini-2.0-flash-exp") {
    this.defaultModel = defaultModel;

    if (apiKey) {
      this.apiKey = apiKey;
    } else {
      // Create a function that gets the API key from storage
      this.apiKey = this.getApiKeyFromStorage;
    }
  }

  // Method to get API key from storage
  private getApiKeyFromStorage = async (): Promise<string> => {
    try {
      const data = await browser.storage.local.get(["geminiApiKey"]);
      if (data.geminiApiKey) {
        return data.geminiApiKey;
      }
      console.warn("No API key found in storage");
      throw new Error(
        "No API key found. Please add your Gemini API key in settings."
      );
    } catch (error) {
      console.error("Error getting API key from storage:", error);
      throw error;
    }
  };

  // Method to create and return a Google AI model
  public getModel(model?: string, options?: { [key: string]: any }) {
    const modelToUse = model || this.defaultModel;
    return createGoogleGenerativeAI({
      apiKey: this.apiKey,
      ...options,
    })(modelToUse);
  }

  // Method to update the API key
  public updateApiKey(newApiKey: string) {
    this.apiKey = newApiKey;
  }
}

// Function to read the content of a tab and convert it to markdown
export const readTab = async (
  tabId: number,
  usingLlm: boolean = false,
  apiKey?: string
): Promise<string | null> => {
  try {
    let content;

    // Try using the newer API (Manifest V3)
    if (browser.scripting) {
      const results = await browser.scripting.executeScript({
        target: { tabId },
        func: () => document.documentElement.outerHTML,
      });
      content = results[0].result;
    }
    // Fallback to message-based approach
    else {
      // Send a message to the tab to get its content
      content = await browser.tabs.sendMessage(tabId, {
        action: "getPageContent",
      });
    }

    if (!content) {
      console.warn(`No content received from tab ${tabId}`);
      return null;
    }

    // Convert HTML to markdown using dom-to-semantic-markdown
    const markdown = convertHtmlToMarkdown(content);

    if (!usingLlm) return markdown;

    // Create GoogleAI instance for this operation
    const googleAIInstance = new GoogleAI(apiKey);

    const { text } = await generateText({
      model: googleAIInstance.getModel("gemini-2.0-flash-lite-preview-02-05"),
      system: "You are a helpful assistant name BearMind.",
      messages: readMarkdownPrompt(markdown) as CoreMessage[],
    });

    return text;
  } catch (error) {
    console.error(`Error getting/converting content for tab ${tabId}:`, error);
    return null;
  }
};

// Function to process tabs and convert them to markdown
export const readTabs = async (
  tabs: BrowserTab[],
  convertedTabIds: number[],
  onTabProcessed?: (processedTab: BrowserTab) => void,
  apiKey?: string // Add API key parameter
): Promise<Record<number, string>> => {
  // Process new tabs that haven't been converted to markdown yet
  const markdownContents: Record<number, string> = {};
  const processedTabs: BrowserTab[] = [];

  // Only process tabs that haven't been converted yet
  for (const tab of tabs) {
    if (!convertedTabIds.includes(tab.id)) {
      // Notify about tab being processed
      if (onTabProcessed) {
        processedTabs.push(tab);
        onTabProcessed(tab);
      }

      // Pass API key to readTab
      const markdown = await readTab(tab.id, false, apiKey);
      if (markdown) {
        markdownContents[tab.id] = markdown;
      }
    }
  }

  return markdownContents;
};

// Function to convert chat history to messages for the AI
export function historyToMessages(
  data: {
    text: string;
    tabs?: BrowserTab[];
    highlightedText?: Record<number, string>;
    currentTabId?: number;
  },
  chatHistory: any[],
  markdownContents?: Record<number, string>,
  tabs?: BrowserTab[],
  currentTabId?: number
): Omit<Message, "id">[] {
  // Create an array to hold the formatted messages
  const messages: Omit<Message, "id">[] = [];

  let context = "";

  // Process markdown contents from tabs if available
  if (markdownContents) {
    const currentTabIdStr = currentTabId?.toString();

    console.log("Current tab ID:", currentTabIdStr);
    console.log("Markdown contents:", markdownContents);

    // Process current tab first if it exists in the markdown contents
    if (currentTabIdStr && markdownContents[currentTabIdStr]) {
      const currentTab = tabs?.find((t) => t.id.toString() === currentTabIdStr);
      const tabTitle = currentTab?.title || "Current Tab";
      context += `CONTENT FROM CURRENT TAB '${tabTitle}' (ID: ${currentTabIdStr}):\n${markdownContents[currentTabIdStr]}\n---\n\n`;
    }

    // Then process other tabs
    for (const tabId in markdownContents) {
      if (markdownContents.hasOwnProperty(tabId) && tabId !== currentTabIdStr) {
        const tab = data.tabs?.find((t) => t.id.toString() === tabId);
        if (!tab) continue; // Skip if tab is not found
        const tabTitle = tab?.title || "Unknown Tab";
        context += `CONTENT FROM TAB '${tabTitle}' (ID: ${tabId}):\n${markdownContents[tabId]}\n---\n\n`;
      }
    }
  }

  // Add context as system message if we have any
  if (context) {
    messages.push({
      role: "system",
      content: `Use the following tab contents as context for answering the user's questions, If you mention specific tab write it as "TAB-<TAB-ID>" as a word no leading character and styling syntax before and after, for example "TAB-123", and it will be parsed and render properly in the UI:\n\n${context}`,
    });
  }

  // Add previous messages from chat history
  console.log("Chat history:", chatHistory);
  for (const msg of chatHistory) {
    console.log(msg);
    // Skip messages that are not completed (like streaming ones)
    if (msg.status === "streaming") continue;

    // Map "user" and "assistant" to the roles expected by the AI
    const role = msg.sender === "user" ? "user" : "assistant";

    let messageContent = msg.message;

    // If it's a user message and has highlighted text, include it in the content
    if (
      role === "user" &&
      msg.highlightedText != "" &&
      Object.keys(msg.highlightedText).length > 0
    ) {
      messageContent += "\n\nUSER HIGHLIGHT TEXT FROM TABs:";

      // Add highlighted text from each tab
      for (const tabId in msg.highlightedText) {
        if (msg.highlightedText[tabId] === "") continue; // Skip empty highlights
        if (msg.highlightedText.hasOwnProperty(tabId)) {
          // Find tab title if possible
          const tab =
            msg.tabs?.find((t) => t.id.toString() === tabId) ||
            tabs?.find((t) => t.id.toString() === tabId);
          const tabTitle = tab?.title || `Tab ${tabId}`;

          messageContent += `\n\nUSER HIGHLIGHT TEXT FROM TITLE "${tabTitle}" (ID: ${tabId}):\n${msg.highlightedText[tabId]}\n`;
        }
      }
    }

    messages.push({
      role,
      content: messageContent,
    });
  }

  // Add the current user message
  let user_text = data.text;

  if (data.highlightedText && Object.keys(data.highlightedText).length > 0) {
    // Add highlighted text from each tab
    for (const tabId in data.highlightedText) {
      if (data.highlightedText[tabId] === "") continue; // Skip empty highlights
      if (data.highlightedText.hasOwnProperty(tabId)) {
        // Find tab title if possible
        const tab =
          data.tabs?.find((t) => t.id.toString() === tabId) ||
          tabs?.find((t) => t.id.toString() === tabId);
        const tabTitle = tab?.title || `Tab ${tabId}`;

        user_text += `\n\nUSER HIGHLIGHT TEXT FROM TITLE "${tabTitle}" (ID: ${tabId}):\n${data.highlightedText[tabId]}\n`;
      }
    }
  }

  messages.push({
    role: "user",
    content: user_text,
  });

  return messages.length > 0 ? messages : [];
}

// Function to generate AI response
export async function generateAIResponse(
  data: {
    text: string;
    tabs: BrowserTab[];
    model: string;
    highlightedText: Record<number, string>;
    currentTabId: number;
  },
  chatHistory: any[],
  markdownContents: Record<number, string>,
  onStreamUpdate: (text: string) => void,
  apiKey?: string // Add API key parameter
): Promise<string> {
  const messages = historyToMessages(
    data,
    chatHistory,
    markdownContents,
    data.tabs,
    data.currentTabId
  );

  console.log("Messages for AI:", messages);

  try {
    // Create GoogleAI instance with provided API key
    const googleAIInstance = new GoogleAI(apiKey);

    const { textStream, sources, providerMetadata } = streamText({
      model: googleAIInstance.getModel(data.model, {
        useSearchGrounding: true,
        dynamicRetrievalConfig: {
          mode: "MODE_UNSPECIFIED", // "MODE_DYNAMIC", // MODE_UNSPECIFIED
          dynamicThreshold: 0.8,
        },
      }),
      system: "You are a helpful assistant name BearMind.",
      messages: messages,
      onError({ error }) {
        console.error("Error in stream:", error);
        throw error; // Re-throw to be caught by the outer try-catch
      },
    });

    let fullText = "";
    for await (const textPart of textStream) {
      fullText += textPart;
      onStreamUpdate(fullText);
    }

    // access the grounding metadata. Casting to the provider metadata type
    // is optional but provides autocomplete and type safety.
    const metadata = providerMetadata?.google as
    | GoogleGenerativeAIProviderMetadata
    | undefined;
    const groundingMetadata = metadata?.groundingMetadata;
    const safetyRatings = metadata?.safetyRatings;

    console.log("Grounding Metadata:", groundingMetadata);
    console.log("Safety Ratings:", safetyRatings);
    console.log("Sources:", sources);

    return fullText;
  } catch (error) {
    // Handle the error
    console.error("Error generating AI response:", error);

    // Display error message with toast
    let errorMessage = "Failed to generate response";
    if (error instanceof Error) {
      errorMessage = `Error: ${error.message}`;
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    // Show toast notification
    toast({
      title: "AI Generation Error",
      description: errorMessage,
      variant: "destructive",
    });

    // Return the error message as the response
    return `I encountered an error while processing your request. ${errorMessage}`;
  }
}

// Function to convert HTML to markdown (import from existing code)
import { convertHtmlToMarkdown } from "dom-to-semantic-markdown";
import { get } from "react-hook-form";
