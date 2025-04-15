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
  CachedContent,
  createPartFromUri,
  createUserContent,
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
    //   model: getModel("gemini-2.0-flash-001-lite-preview-02-05", {
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
  apiKey?: string, // Add API key parameter
  tabsToReread: number[] = [] // Add tabsToReread parameter
): Promise<Record<number, string>> => {
  // Process new tabs that haven't been converted to markdown yet
  const markdownContents: Record<number, string> = {};
  const processedTabs: number[] = [];

  // Fetch all tabs to get their URLs

  // Process tabs that need to be processed (new tabs or tabs marked for re-reading)
  for (const tabId of usedTabs) {
    // Process if the tab is new (not converted) or is in the tabsToReread list
    if (!convertedTabIds.includes(tabId) || tabsToReread.includes(tabId)) {
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

const systemPrompt = {
  text:
    "You are a helpful assistant name BearMind. Your a an AI companion for browsing the internet on a browser. User can ask you question about their tabs, the tab content will be provided for you to answer. If you not sure about your answer, use Search Tool if available\n" +
    'If you mention specific tab in the context write it as "TAB-<TAB-ID>" as a word no leading character and styling syntax before and after, for example "TAB-123", and it will be parsed and render properly in the UI. Do not use TAB syntax for sources of search information.',
};

function isCacheExpired(expireTimeStr: string) {
  /**
   * Checks if a cache entry is expired based on the expire_time.
   *
   * @param {string} expireTimeStr - A timestamp string in RFC 3339 format (UTC).
   *                                 Examples: "2014-10-02T15:01:23Z", "2014-10-02T15:01:23.045123456Z", "2014-10-02T15:01:23+05:30".
   *
   * @returns {boolean} True if the cache is expired, False otherwise.
   */
  try {
    const expireTime = new Date(expireTimeStr);

    if (isNaN(expireTime.getTime())) {
      console.error("Invalid expire_time format. Please use RFC 3339 format.");
      return false;
    }

    const nowUtc = new Date();

    return nowUtc > expireTime;
  } catch (error) {
    console.error("Error parsing expire_time:", error);
    return false;
  }
}

const createCacheContent = async (
  ai: GoogleGenAI,
  modelName: string,
  contents: Part | Part[],
  systemInstruction: String
) => {
  console.log("Creating cache content for model:", modelName);
  const cache = await ai.caches.create({
    model: modelName,
    config: {
      contents: contents,
      // systemInstruction: "" + systemInstruction,
    },
  });

  console.log("Cache created:", cache);
  return cache;
};

// Extract YouTube video handling into a separate function
export function handleYoutubeVideo(
  text: string,
  currentTabId?: number | null,
  tabs?: Record<number, BrowserTab>
): { text: string; video?: FileData } {
  // Helper function to check if a URL is a YouTube video and extract the FileData
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

  // Helper function to extract YouTube video from user message if present
  const extractYoutubeFromMessage = (
    messageText: string
  ): { text: string; video?: FileData } => {
    // Check for YouTube URL in the text
    const youtubeRegex =
      /(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/;
    const match = youtubeRegex.exec(messageText);

    if (!match) return { text: messageText };

    const url = match[0];
    const youtubeVideo = checkYoutubeVideo(url);

    if (!youtubeVideo) return { text: messageText };

    // Remove the URL from the text to avoid redundancy
    const cleanText = messageText.replace(url, "").trim();

    return {
      text: cleanText,
      video: youtubeVideo,
    };
  };

  let user_text = text;
  let youtubeVideo: FileData | undefined = undefined;

  // Check for YouTube video in the user's message
  const extractedContent = extractYoutubeFromMessage(user_text);
  if (extractedContent.video) {
    youtubeVideo = extractedContent.video;
    user_text = extractedContent.text;
  }

  // If no YouTube video found in the message, check the current tab URL
  if (!youtubeVideo && currentTabId && tabs) {
    const currentTab = tabs[currentTabId];
    if (currentTab?.url) {
      youtubeVideo = checkYoutubeVideo(currentTab.url);
    }
    if (youtubeVideo) {
      user_text += `\n\nALSO, ANSWER BASE ON THE VIDEO, PREFER TO GENERATE STRUCTURE ANSWER WITH TIMESTAMP MM:SS\n`;
    }
  }

  console.log("Used YouTube video:", youtubeVideo);

  return {
    text: user_text,
    video: youtubeVideo,
  };
}

// Function to convert chat history to messages for the AI
export const historyToMessages = async (
  ai: GoogleGenAI,
  model: string,
  data: {
    text: string;
    usedTabs?: number[];
    highlightedText?: Record<number, string>;
    currentTabId?: number | null;
  },
  chatHistory: ChatHistory,
  markdownContents?: Record<number, string>,
  tabs?: Record<number, BrowserTab>
): Promise<{
  history: Content[];
  userMessage: Part | Part[];
  cachedList: CachedContent[];
}> => {
  // Create an array to hold the formatted messages
  const messages: Content[] = [];
  const cachedList: CachedContent[] = [];

  // Add previous messages from chat history - keep this static
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

    if (msg.cached) {
      // Check if the cached content is expired
      if (msg.cached.expireTime && isCacheExpired(msg.cached.expireTime)) {
        // recreate cache content if expired
        if (
          msg.cachedContent &&
          msg.cached.model &&
          msg.cacheSystemInstructions
        ) {
          const cache = await createCacheContent(
            ai,
            msg.cached.model,
            msg.cachedContent,
            msg.cacheSystemInstructions
          );
          cachedList.push(cache);
        }
      } else {
        // Add cached content to the list
        const cachedContent = msg.cached;
        cachedList.push(cachedContent);
      }
    }
  }

  let context = "";

  // Add tab contents as separate messages in the history
  if (markdownContents && tabs && data.usedTabs) {
    // Process current tab first if it exists in the markdown contents
    if (data.currentTabId && markdownContents[data.currentTabId]) {
      const currentTab = tabs[data.currentTabId];
      const tabTitle = currentTab?.title ?? "Current Tab";
      const tabContent = `CONTENT FROM CURRENT TAB '${tabTitle}' (ID: ${
        data.currentTabId
      }):\n${markdownContents[data.currentTabId]}`;

      // messages.push({
      //   role: "user",
      //   parts: [{ text: tabContent }],
      // });

      context += `\n\n${tabContent}`;
    }

    // Then process other tabs
    for (const tabId of data.usedTabs) {
      if (data.currentTabId && tabId === data.currentTabId) continue; // Skip current tab
      if (markdownContents.hasOwnProperty(tabId)) {
        const tab = tabs[tabId];
        if (!tab) continue; // Skip if tab is not found
        const tabTitle = tab?.title ?? "Unknown Tab";
        const tabContent = `CONTENT FROM TAB '${tabTitle}' (ID: ${tabId}):\n${markdownContents[tabId]}`;

        // messages.push({
        //   role: "user",
        //   parts: [{ text: tabContent }],
        // });
        context += `\n\n${tabContent}`;
      }
    }
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
  let userMessage: Part[] = [];
  // handle youtube video
  if (data.currentTabId && tabs && tabs[data.currentTabId].type === "youtube") {
    const { text, video } = handleYoutubeVideo(
      user_text,
      data.currentTabId,
      tabs
    );

    user_text = text;
    userMessage.push({
      fileData: {
        fileUri: video?.fileUri,
      }
    })

    // // create cache content for youtube video
    // if (video?.fileUri && video.mimeType) {
    //   const cache = await createCacheContent(
    //     ai,
    //     model,
    //     {
    //       fileData: {
    //         fileUri: video.fileUri,
    //       },
    //     },
    //     systemPrompt.text
    //   );
    //   cachedList.push(cache);

    //   user_text = text;
    // }
  }

  userMessage.push({
    text: user_text + context,
  });

  return {
    history: messages,
    userMessage,
    cachedList,
  };
};

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
    const errorMessage =
      "No API key provided. Please add your Gemini API key in settings.";
    toast({
      title: "API Key Required",
      description: errorMessage,
      variant: "destructive",
    });
    return errorMessage;
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  const { history, userMessage, cachedList } = await historyToMessages(
    ai,
    modelId,
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
    const chat = ai.chats.create({
      model: modelId,
      history: history,
      config: {
        systemInstruction: systemPrompt,
        tools: useSearch ? [{ googleSearch: {} }] : [],
        cachedContent: cachedList.length === 0 ? undefined : cachedList[0].name,
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

export async function getModelList(apiKey?: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey });
    const models = ai.models;
    return models;
  } catch (error) {
    console.error("Error fetching model list:", error);
    return null;
  }
}

// Function to convert HTML to markdown (import from existing code)
import { convertHtmlToMarkdown } from "dom-to-semantic-markdown";
import { ChatHistory } from "@/entrypoints/sidepanel/types";
