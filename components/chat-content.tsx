import React, { useState, RefObject } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Assuming shadcn/ui setup
import { Button } from "@/components/ui/button"; // Assuming shadcn/ui setup
import { MemoizedMarkdown } from "./memoized-markdown";
import {
  FileText,
  RefreshCcw,
  ThumbsDown,
  ThumbsUp,
  Globe,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  X,
  Copy,
  Check,
} from "lucide-react"; // Added icons
import { TabDisplayWithHover } from "./tab-display-with-hover";
import { ChatHistory, UserMessage, AssistantMessage, isAssistantMessage} from "@/entrypoints/sidepanel/types";

// Interface for the ChatContent component
export interface ChatContentProps {
  chatHistory: ChatHistory;
  bottomRef: RefObject<HTMLDivElement>;
  onDeleteMessage: (messageId: string) => void;
  onRegenerateMessage: (messageId: string) => void;
}

// Interface for the ChatMessage component
interface ChatMessageProps {
  messageData: UserMessage | AssistantMessage;
  onDelete: (messageId: string) => void;
  onRegenerate: (messageId: string) => void;
}

// Interface for the ActionButtons component
interface ActionButtonsProps {
  onRegenerate: () => void;
  message: string;
}

const ActionButtons = ({ onRegenerate, message }: ActionButtonsProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-1 text-muted-foreground">
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 text-muted-foreground rounded-full hover:bg-muted hover:text-foreground"
        onClick={onRegenerate}
      >
        <RefreshCcw className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-5 w-5 text-muted-foreground rounded-full hover:bg-muted hover:text-foreground"
        onClick={handleCopy}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </Button>
    </div>
  );
};

const renderStatusIndicator = (status: string) => {
  switch (status) {
    case "typing":
      return (
        <div className="flex items-end gap-1 h-6 ml-2">
          <div
            className="w-2 h-2 bg-primary rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-primary rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          ></div>
          <div
            className="w-2 h-2 bg-primary rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          ></div>
        </div>
      );
    case "thinking":
      return (
        <div className="flex items-center gap-2 h-6 ml-2">
          <div className="text-xs italic text-muted-foreground">
            Thinking...
          </div>
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    case "reading":
      return (
        <div className="flex items-center gap-2 h-6 ml-2">
          <div className="text-xs italic text-muted-foreground">Reading...</div>
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    default:
      return null;
  }
};

// const renderAvatarContent = (avatarIcon, name) => {
//   if (!avatarIcon) {
//     return name.substring(0, 2).toUpperCase();
//   }

//   if (typeof avatarIcon === "string") {
//     return avatarIcon;
//   }

//   if (React.isValidElement(avatarIcon)) {
//     return React.cloneElement(avatarIcon, { className: "h-3 w-3" });
//   }

//   return name.substring(0, 2).toUpperCase();
// };

const getStatusAvatar = (status: string) => {
  if (status === "reading") return "ʕ◉ᴥ◉ʔ";
  return "ʕ•ᴥ•ʔ";
};

// Unified chat message component for both user and assistant messages
const ChatMessage = ({ messageData, onDelete, onRegenerate }: ChatMessageProps) => {

  const isAssistant = isAssistantMessage(messageData);
  const { id, name, message, avatarIcon, status, usedTabs } = messageData;
  return (
    <div className="flex flex-col mb-2">
      <div className="flex justify-between gap-2 mt-2 items-center">
        <div className="flex">
          {typeof avatarIcon === "string" ? (
            <p className="text-sm font-semibold text-foreground">
              {isAssistant && status ? getStatusAvatar(status) : avatarIcon}
            </p>
          ) : (
            // <Avatar className="h-6 w-6 border border-secondary">
            //   <AvatarFallback className="bg-muted text-muted-foreground text-xs">
            //     {renderAvatarContent(avatarIcon, name)}
            //   </AvatarFallback>
            // </Avatar>
            <p></p>
          )}

          <p className="text-sm font-semibold text-foreground align-middle">
            {name}
          </p>
          {isAssistant && status && renderStatusIndicator(status)}
        </div>
        {!isAssistant && (
          <Button
            variant="ghost"
            size="no"
            className="h-3.5 w-3.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => onDelete(id)}
          >
            <X />
          </Button>
        )}
      </div>

      {isAssistant && status === "reading" && (
        <div>
          <div className="flex flex-wrap border-l-2 pl-3 text-sm gap-1 text-muted-foreground">
            {usedTabs &&
              usedTabs.length > 0 &&
              usedTabs.map((tabId) => (
                <div key={tabId}>
                  <TabDisplayWithHover tabId={tabId} />
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="prose prose-sm prose-invert max-w-none">
        <MemoizedMarkdown content={message} id={id} />
      </div>

      {!isAssistant && (
        <div className="flex flex-wrap border-l-2 pl-3 text-sm gap-1 text-muted-foreground">
          {usedTabs &&
            usedTabs.length > 0 &&
            [...usedTabs]
              .sort((a, b) => {
                // First prioritize the current tab
                if (a && a.toString() === messageData.currentTabId?.toString())
                  return -1;
                if (b && b.toString() === messageData.currentTabId?.toString())
                  return 1;

                // Then prioritize tabs with highlights
                const aHasHighlight =
                  messageData.highlightedText && a && messageData.highlightedText[a];
                const bHasHighlight =
                  messageData.highlightedText && b && messageData.highlightedText[b];
                if (aHasHighlight && !bHasHighlight) return -1;
                if (!aHasHighlight && bHasHighlight) return 1;
                return 0;
              })
              .map((tabId) => (
                <div
                  className={`${
                    messageData.highlightedText &&
                    tabId &&
                    messageData.highlightedText[tabId] !== ""
                      ? "w-full"
                      : ""
                  }`}
                  key={tabId}
                >
                  <TabDisplayWithHover
                    tabId={tabId}
                    hasHighlight={
                      messageData.highlightedText && tabId
                        ? messageData.highlightedText[tabId]
                        : ""
                    }
                  />
                </div>
              ))}
        </div>
      )}

      {isAssistant && status === "done" && <ActionButtons onRegenerate={() => onRegenerate(id)} message={message} />}
    </div>
  );
};

const StreamingAnimation = () => (
  <div className="flex text-sm font-semibold text-foreground">
    {/* Animation code here */}
  </div>
);

const ChatContent = ({ 
  chatHistory, bottomRef, onDeleteMessage, onRegenerateMessage }: ChatContentProps) => {
  return (
    <div className="flex flex-col bg-background p-4">
      {chatHistory.map((messageData) => (
        <ChatMessage
          key={messageData.id}
          messageData={messageData}
          onDelete={onDeleteMessage}
          onRegenerate={onRegenerateMessage}
        />
      ))}
      <StreamingAnimation />
      <div ref={bottomRef} />
      {/* This is the bottom ref for scrolling */}
    </div>
  );
};

export { ChatMessage, ChatContent };
