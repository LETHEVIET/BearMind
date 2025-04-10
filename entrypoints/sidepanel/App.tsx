import React, { useEffect, useRef, useState } from "react";
import "./App.module.css";
import "../../assets/main.css";
import { browser } from "wxt/browser";
import ExtMessage, { MessageType } from "@/entrypoints/types.ts";
import { useTranslation } from "react-i18next";
import { useAppContext } from "@/components/AppContext";
import QuoteFinder from "@/components/quote-finder";

import ChatInput from "@/components/chat-input";
import { User } from "lucide-react";
import { ChatContent } from "@/components/chat-content";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SettingsModal } from "@/components/settings-modal";
import { ChatSettingsProvider } from "@/components/ChatSettingsContext";

import { BrowserTab } from "@/utils/browser-tabs";
import { 
  readTabs, 
  generateAIResponse,
  GoogleAI 
} from "@/utils/llm-message-formatter";
import { TabReaderPanel } from "@/components/tab-reader-panel";
import { DotBackground } from "@/components/dots-background";

// Initial chat history (unchanged)
const initialChatHistory = [];

// Assistant information constant
const ASSISTANT_INFO = {
  sender: "assistant",
  name: "BearMind",
  avatarIcon: "ʕ•ᴥ•ʔ",
};

// Generate unique message ID (unchanged)
const generateMessageId = () => {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 4);
  return `${timestamp}-${randomPart}`;
};

console.log("Content script loaded");

const App = () => {
  const { ui, session, resetSession } = useAppContext();
  const { t } = useTranslation();
  
  const [chatHistory, setChatHistory] = useState(initialChatHistory);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  // Add state for markdownContents
  const [markdownContents, setMarkdownContents] = useState<Record<string, string>>({});
  // Add state for Google AI instance
  const [googleAIInstance, setGoogleAIInstance] = useState<GoogleAI | null>(null);
  // Add state to toggle quote finder
  const [showQuoteFinder, setShowQuoteFinder] = useState(false);

  // Add a ref for the bottom of the chat content
  const bottomRef = useRef(null);
  
  // Initialize Google AI instance when API key changes
  useEffect(() => {
    // Create a new GoogleAI instance with the current API key
    console.log('Creating GoogleAI instance with API key:', session.apiKey);
    const newGoogleAIInstance = new GoogleAI(session.apiKey);
    setGoogleAIInstance(newGoogleAIInstance);
    
    console.log("GoogleAI instance created with API key:", session.apiKey ? "API key provided" : "Using storage/fallback");
  }, [session.apiKey]);

  // Reset chat history function
  const resetChat = () => {
    setChatHistory([]);
    resetSession();
    setMarkdownContents({});
  };

  // Function to delete a message from chat history
  const deleteMessage = (messageId) => {
    setChatHistory((prevHistory) => {
      // Find the index of the message to delete
      const messageIndex = prevHistory.findIndex((msg) => msg.id === messageId);
      
      if (messageIndex === -1) return prevHistory; // Message not found
      
      // Create a new array without the deleted message
      // If it's a user message, also remove the corresponding assistant message that follows it
      if (prevHistory[messageIndex].sender === "user" && messageIndex + 1 < prevHistory.length) {
        if (prevHistory[messageIndex + 1].sender === "assistant") {
          // Remove both user message and the assistant's response
          return [
            ...prevHistory.slice(0, messageIndex),
            ...prevHistory.slice(messageIndex + 2)
          ];
        }
      }
      
      // Otherwise just remove the single message
      return [
        ...prevHistory.slice(0, messageIndex),
        ...prevHistory.slice(messageIndex + 1)
      ];
    });
  };

  // Function to regenerate a response when the refresh button is clicked
  const regenerateMessage = async (messageId) => {
    // Find the assistant message to regenerate
    const assistantMessageIndex = chatHistory.findIndex(msg => msg.id === messageId);
    if (assistantMessageIndex === -1 || chatHistory[assistantMessageIndex].sender !== "assistant") {
      return; // Message not found or not an assistant message
    }

    // Find the corresponding user message that came before this assistant message
    let userMessageIndex = assistantMessageIndex - 1;
    while (userMessageIndex >= 0) {
      if (chatHistory[userMessageIndex].sender === "user") {
        break;
      }
      userMessageIndex--;
    }

    if (userMessageIndex < 0) {
      return; // No user message found before this assistant message
    }

    // Get the user message data
    const userMessage = chatHistory[userMessageIndex];

    // Delete the assistant message and all messages after it
    setChatHistory(prevHistory => prevHistory.slice(0, userMessageIndex));

    // Regenerate the response using the user message data
    const data = {
      text: userMessage.message,
      tabs: userMessage.tabs || [],
      model: userMessage.model || session.selectedModel.id,
      highlightedText: userMessage.highlightedText || {},
      currentTabId: userMessage.currentTabId
    };

    // Use the existing handleChatSubmit flow to regenerate the response
    await handleChatSubmit(data);
  };

  // Updated scrollToBottom function
  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Auto-scroll when chat history changes
  useEffect(() => {
    if (chatHistory.length > 0 && shouldAutoScroll) {
      scrollToBottom();
    }
  }, [chatHistory, shouldAutoScroll]);

  // Scroll event listener (unchanged)
  useEffect(() => {
    const scrollContainer = scrollAreaRef.current;

    const handleScroll = () => {
      if (!scrollContainer) return;

      const isNearBottom =
        scrollContainer.scrollHeight -
          scrollContainer.scrollTop -
          scrollContainer.clientHeight <
        100;

      if (shouldAutoScroll !== isNearBottom) {
        setShouldAutoScroll(isNearBottom);
      }
    };

    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, [shouldAutoScroll]);

  // Apply font size based on UI settings
  useEffect(() => {
    // Set CSS variable for base font size instead of directly setting fontSize
    document.documentElement.style.setProperty(
      '--base-font-size',
      ui.fontSize === 'small' ? '14px' : 
      ui.fontSize === 'large' ? '18px' : '16px'
    );
  }, [ui.fontSize]);

  // Handle chat submission (updated to use the AppContext)
  const handleChatSubmit = async (data: {
    text: string;
    tabs: BrowserTab[];
    model: string;
    highlightedText: Record<number, string>;
    currentTabId: number;
    useMock?: boolean; // Add this optional parameter
  }) => {
    const newUserMessage = {
      id: generateMessageId(),
      sender: "user",
      name: "Lê Thế Việt",
      avatarIcon: <User className="h-5 w-5" />,
      message: data.text,
      tabs: data.tabs,
      model: data.model,
      highlightedText: data.highlightedText,
      currentTabId: data.currentTabId,
    };

    setChatHistory((prevHistory) => [...prevHistory, newUserMessage]);

    const assistantMessageId = generateMessageId();
    const loadingMessage = {
      id: assistantMessageId,
      ...ASSISTANT_INFO,
      message: "",
      status: "streaming",
      tabs: data.tabs,
    };

    setChatHistory((prevHistory) => [...prevHistory, loadingMessage]);
    setIsLoading(true);
    setShouldAutoScroll(true);

    // Process tabs using the utility function
    const updateTabProcessingStatus = (processedTab: BrowserTab) => {
      setChatHistory((prevHistory) =>
        prevHistory.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                status: "reading",
                message: "",
                readingTabs: prevHistory
                  .find((m) => m.id === assistantMessageId)
                  ?.tabs?.concat(processedTab) || [processedTab],
              }
            : msg
        )
      );
    };

    try {
      // First, process any tabs that need to be read
      let newMarkdownContents: Record<string, string> = {};
      if (data.tabs && data.tabs.length > 0) {
        newMarkdownContents = await readTabs(
          data.tabs, 
          session.convertedTabIds, 
          updateTabProcessingStatus,
          session.apiKey // Pass the API key from context
        );
        
        // Update the list of converted tabs in the context
        const newTabIds = Object.keys(newMarkdownContents).map(Number);
        if (newTabIds.length > 0) {
          newTabIds.forEach(tabId => {
            if (!session.convertedTabIds.includes(tabId)) {
              resetSession(); // Use the context function to add converted tab IDs
            }
          });
        }
        
        // Update markdownContents state
        setMarkdownContents(prev => ({...prev, ...newMarkdownContents}));
      }

      // Change status back to streaming before generating response
      setChatHistory((prevHistory) =>
        prevHistory.map((msg) =>
          msg.id === assistantMessageId
            ? { ...msg, status: "streaming", message: "" }
            : msg
        )
      );

      // Use the utility function to generate AI response
      const updateStreamText = (text: string) => {
        setChatHistory((prevHistory) =>
          prevHistory.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, message: text, status: "streaming" }
              : msg
          )
        );
        scrollToBottom();
      };

      const fullText = await generateAIResponse(
        data,
        chatHistory,
        {...markdownContents, ...newMarkdownContents}, // Use both existing and new markdown contents
        updateStreamText,
        session.apiKey // Pass the API key from context
      );

      setChatHistory((prevHistory) =>
        prevHistory.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                message: fullText,
                status: "done",
              }
            : msg
        )
      );
    } catch (error) {
      console.error("Error generating AI response:", error);
      const errorMessage = {
        id: assistantMessageId,
        ...ASSISTANT_INFO,
        avatarIcon: "ʕ •ᴥ•ʔ", // Sad bear face for errors
        message:
          "Sorry, I encountered an error while generating a response. Please try again.",
        status: "done",
      };

      setChatHistory((prevHistory) =>
        prevHistory.map((msg) =>
          msg.id === assistantMessageId ? errorMessage : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${ui.theme} w-screen h-screen`}>
      <div className="flex flex-col bg-background gap-0 h-full max-w-4xl mx-auto w-screen">
        <div className="flex items-center justify-between p-0.5 px-4 border-b">
          <div className="text-foreground">BearMind</div>
          <div className="flex items-center gap-2">
            {/* Add Quote Finder toggle button */}
            <button 
              onClick={() => setShowQuoteFinder(!showQuoteFinder)}
              className="px-2 py-1 rounded bg-secondary hover:bg-secondary/80 text-foreground"
            >
              {showQuoteFinder ? 'Hide Quote Finder' : 'Find Quote in Page'}
            </button>
            <SettingsModal resetChat={resetChat} />
          </div>
        </div>
        
        {/* Show QuoteFinder when toggle is active */}
        {showQuoteFinder && (
          <div className="border-b">
            <QuoteFinder onClose={() => setShowQuoteFinder(false)} />
          </div>
        )}
        
        <div className="flex-grow overflow-hidden w-full">
          {chatHistory.length === 0 ? (
            <DotBackground className="flex items-center justify-center h-full">
            <div className="flex-col flex items-center justify-center h-full gap-4 text-muted-foreground">
              <p className="text-5xl">ʕ•ᴥ•ʔ</p>
              <p className="text-xl">Ask BearMind</p>
              <p className="text-basesada text-center">
                BearMind is powered by AI, so mistakes are possible.
                <br />
                Review output carefully before using.
              </p>
            </div>
            </DotBackground>
          ) : (
            <ScrollArea className="h-full w-full" ref={scrollAreaRef}>
              {/* Pass bottomRef, deleteMessage, and regenerateMessage to ChatContent */}
              <ChatContent 
                chatHistory={chatHistory} 
                bottomRef={bottomRef} 
                onDeleteMessage={deleteMessage}
                onRegenerateMessage={regenerateMessage}
              />
            </ScrollArea>
          )}
        </div>
        <div className="flex-none">
          <ChatInput onSubmit={handleChatSubmit} />
        </div>
      </div>
    </div>
  );
};

// Wrap App with ChatSettingsProvider
export default () => (
  <ChatSettingsProvider>
    <App />
  </ChatSettingsProvider>
);
