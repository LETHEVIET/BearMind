import {
  createGoogleGenerativeAI,
  GoogleGenerativeAIProvider,
} from "@ai-sdk/google";
import { generateText, streamText } from "ai";
import { BrowserTab } from "./browser-tabs";
import { readMarkdownPrompt } from "./prompts";
import { CoreMessage, Message } from "ai";
import { browser } from "wxt/browser";
import { toast } from "../hooks/use-toast";
import {
  FileData,
  GenerateContentResponseUsageMetadata,
  GoogleGenAI,
  GroundingMetadata,
} from "@google/genai";
import {
  Chat,
  Content,
  GenerateContentConfig,
  Models,
  Part,
  Candidate,
} from "@google/genai";

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

    // const { text } = await generateText({
    //   model: getModel("gemini-2.0-flash-lite-preview-02-05", {
    //     apiKey: apiKey,
    //   }),
    //   system: "You are a helpful assistant name BearMind.",
    //   messages: readMarkdownPrompt(markdown) as CoreMessage[],
    // });

    return markdown;
  } catch (error) {
    console.error(`Error getting/converting content for tab ${tabId}:`, error);
    return null;
  }
};

// Function to process tabs and convert them to markdown
export const readTabs = async (
  usedTabs: number[],
  convertedTabIds: number[],
  tabs: Record<number, BrowserTab>,
  onTabProcessed?: (processedTab: number) => void,
  apiKey?: string // Add API key parameter
): Promise<Record<number, string>> => {
  // Process new tabs that haven't been converted to markdown yet
  const markdownContents: Record<number, string> = {};
  const processedTabs: number[] = [];

  // Fetch all tabs to get their URLs

  // Only process tabs that haven't been converted yet
  for (const tabId of usedTabs) {
    if (!convertedTabIds.includes(tabId)) {
      // Check if the tab is a YouTube video
      const tab = tabs[tabId];
      if (tab?.url) {
        const isYoutubeVideo =
          /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/.test(tab.url);
        if (isYoutubeVideo) {
          console.log(`Skipping YouTube video tab ${tabId}: ${tab.title}`);
          continue; // Skip this tab as it's a YouTube video
        }
      }

      // Notify about tab being processed
      if (onTabProcessed) {
        processedTabs.push(tabId);
        onTabProcessed(tabId);
      }

      // Pass API key to readTab
      const markdown = await readTab(tabId, false, apiKey);
      if (markdown) {
        markdownContents[tabId] = markdown;
      }
    }
  }

  return markdownContents;
};

// Function to convert chat history to messages for the AI
export function historyToMessages(
  data: {
    text: string;
    usedTabs?: number[];
    highlightedText?: Record<number, string>;
    currentTabId?: number | null;
  },
  chatHistory: ChatHistory,
  markdownContents?: Record<number, string>,
  tabs?: Record<number, BrowserTab>
): {
  history: Content[];
  userMessage: Part | Part[];
  systemPrompt: Part;
} {
  // Create an array to hold the formatted messages
  const messages: Content[] = [];

  let context = "";

  // Process markdown contents from tabs if available
  if (markdownContents && tabs && data.usedTabs) {
    // Process current tab first if it exists in the markdown contents
    if (data.currentTabId && markdownContents[data.currentTabId]) {
      const currentTab = tabs[data.currentTabId];
      const tabTitle = currentTab?.title ?? "Current Tab";
      context += `CONTENT FROM CURRENT TAB '${tabTitle}' (ID: ${
        data.currentTabId
      }):\n${markdownContents[data.currentTabId]}\n---\n\n`;
    }

    // Then process other tabs
    for (const tabId of data.usedTabs) {
      if (data.currentTabId && tabId === data.currentTabId) continue; // Skip current tab
      if (markdownContents.hasOwnProperty(tabId)) {
        const tab = tabs[tabId];
        if (!tab) continue; // Skip if tab is not found
        const tabTitle = tab?.title ?? "Unknown Tab";
        context += `CONTENT FROM TAB '${tabTitle}' (ID: ${tabId}):\n${markdownContents[tabId]}\n---\n\n`;
      }
    }
  }

  // Add context as system message if we have any
  const systemPrompt = {
    text:
      "You are a helpful assistant name BearMind.\n" +
      (context
        ? `Use the following tab contents as context for answering the user's questions, If you mention specific tab in the context write it as "TAB-<TAB-ID>" as a word no leading character and styling syntax before and after, for example "TAB-123", and it will be parsed and render properly in the UI. Do not use TAB syntax for sources of search information:\n\n${context}`
        : ""),
  };

  // Add previous messages from chat history
  console.log("Chat history:", chatHistory);
  for (const msg of chatHistory) {
    const role = msg.sender === "user" ? "user" : "model";
    const messageContent = msg.message;

    messages.push({
      role,
      parts: [
        {
          text: messageContent,
        },
      ],
    });
  }

  // Add the current user message
  let user_text = data.text;

  if (
    data.highlightedText &&
    Object.keys(data.highlightedText).length > 0 &&
    data.usedTabs
  ) {
    // Add highlighted text from each tab
    for (const tabId in data.highlightedText) {
      // Skip if the tabId is not in usedTabs
      if (!data.usedTabs.includes(parseInt(tabId))) continue;
      if (data.highlightedText[tabId] === "") continue; // Skip empty highlights
      if (data.highlightedText.hasOwnProperty(tabId)) {
        // Find tab title if possible
        const tab = tabs ? tabs[parseInt(tabId)] : null;
        const tabTitle = tab?.title ?? `Tab ${tabId}`;

        user_text += `\n\nUSER HIGHLIGHT TEXT FROM TITLE "${tabTitle}" (ID: ${tabId}):\n${data.highlightedText[tabId]}\n`;
      }
    }
  }

  const checkYoutubeVideo = (url: string): FileData | undefined => {
    const youtubeRegex =
      /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    if (!youtubeRegex.test(url)) return undefined;

    // Extract video ID from different YouTube URL formats
    let videoId;
    if (url.includes("youtube.com/watch?v=")) {
      videoId = url.split("v=")[1]?.split("&")[0];
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0];
    } else {
      return undefined;
    }

    if (!videoId) return undefined;

    return {
      mimeType: "video/youtube",
      fileUri: `https://www.youtube.com/watch?v=${videoId}`,
    };
  };

  // Extract YouTube video from user message if present
  const extractYoutubeFromMessage = (
    text: string
  ): { text: string; video?: FileData } => {
    // Check for YouTube URL in the text
    const youtubeRegex =
      /(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/;
    const match = youtubeRegex.exec(text);

    if (!match) return { text };

    const url = match[0];
    const youtubeVideo = checkYoutubeVideo(url);

    if (!youtubeVideo) return { text };

    // Remove the URL from the text to avoid redundancy
    const cleanText = text.replace(url, "").trim();

    return {
      text: cleanText,
      video: youtubeVideo,
    };
  };

  // check the current tab URL for youtube video
  let youtubeVideo: FileData | undefined = undefined;

  // Check for YouTube video in the user's message
  const extractedContent = extractYoutubeFromMessage(user_text);
  if (extractedContent.video) {
    youtubeVideo = extractedContent.video;
    user_text = extractedContent.text;
  }

  // If no YouTube video found in the message, check the current tab URL
  if (!youtubeVideo && data.currentTabId && tabs) {
    const currentTab = tabs[data.currentTabId];
    if (currentTab?.url) {
      youtubeVideo = checkYoutubeVideo(currentTab.url);
    }
    if (youtubeVideo) {
      user_text += `\n\nALSO, ANSWER BASE ON THE VIDEO\n`;
    }
  }

  console.log("Used YouTube video:", youtubeVideo);

  const userMessage = youtubeVideo
    ? [{ text: user_text }, { fileData: youtubeVideo }]
    : { text: user_text };

  return {
    history: messages,
    userMessage,
    systemPrompt,
  };
}

// Function to check API key availability
function isApiKeyAvailable(apiKey?: string): boolean {
  return !!apiKey && apiKey.trim() !== "";
}

// Function to generate AI response
export async function generateAIResponse(
  data: {
    text: string;
    usedTabs: number[];
    highlightedText: Record<number, string>;
    currentTabId: number | null;
  },
  modelId: string,
  useSearch: boolean,
  tabs: Record<number, BrowserTab>,
  chatHistory: any[],
  markdownContents: Record<number, string>,
  onStreamUpdate: (
    text: string,
    usageMetadata: GenerateContentResponseUsageMetadata | undefined,
    groundingMetadata: GroundingMetadata | undefined
  ) => void,
  apiKey?: string // Add API key parameter
): Promise<string> {
  // Check if API key is available
  if (!isApiKeyAvailable(apiKey)) {
    const errorMessage = "No API key provided. Please add your Gemini API key in settings.";
    toast({
      title: "API Key Required",
      description: errorMessage,
      variant: "destructive",
    });
    return errorMessage;
  }

  const { history, userMessage, systemPrompt } = historyToMessages(
    data,
    chatHistory,
    markdownContents,
    tabs
  );

  console.log("modelId:", modelId);
  console.log("Use search:", useSearch);
  console.log("History:", history);
  console.log("User message:", userMessage);
  console.log("System prompt:", systemPrompt);

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const chat = ai.chats.create({
      model: modelId,
      history: history,
      config: {
        systemInstruction: systemPrompt,
        tools: useSearch ? [{ googleSearch: {} }] : [],
      },
    });

    const response = await chat.sendMessageStream({
      message: userMessage,
    });

    let fullText = "";
    let lastChunk = null; // Track the last chunk
    for await (const chunk of response) {
      fullText += chunk.text;
      onStreamUpdate(
        fullText,
        chunk.usageMetadata,
        chunk.candidates?.[0]?.groundingMetadata
      );
      lastChunk = chunk; // Store the current chunk as the last chunk
    }

    // Log the last chunk of the response instead of the full response object
    console.log("Last AI response chunk:", lastChunk);

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
import { ChatHistory } from "@/entrypoints/sidepanel/types";
