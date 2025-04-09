import React, { useState } from "react";
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

// Updated component to display selected tabs with detailed information
const SelectedTabsTag = ({ tabs }) => {
  const [expanded, setExpanded] = useState(false);

  if (!tabs || tabs.length === 0) return null;

  return (
    <div className="mt-2 w-full">
      <div
        className="inline-flex items-center gap-1.5 border rounded-xl px-2 py-1 text-xs font-medium mr-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <Globe className="h-3 w-3" />
        <span>
          {tabs.length} tab{tabs.length !== 1 ? "s" : ""} selected
        </span>
        {expanded ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </div>

      {expanded && (
        <div className="mt-2 pl-2 border-l-2 text-xs">
          {tabs.map((tab, index) => (
            <div key={index} className="mb-2 border p-2 rounded-md">
              <div className="font-medium truncate">
                {tab.title || "Unnamed Tab"}
              </div>
              <div className="text-muted-foreground flex items-center gap-1 truncate">
                <ExternalLink className="h-3 w-3" />
                <span className="truncate">{tab.url}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ActionButtons = ({ onRegenerate, message }) => {
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

const renderStatusIndicator = (status) => {
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

const renderAvatarContent = (avatarIcon, name) => {
  if (!avatarIcon) {
    return name.substring(0, 2).toUpperCase();
  }

  if (typeof avatarIcon === "string") {
    return avatarIcon;
  }

  if (React.isValidElement(avatarIcon)) {
    return React.cloneElement(avatarIcon, { className: "h-3 w-3" });
  }

  return name.substring(0, 2).toUpperCase();
};

const getStatusAvatar = (status) => {
  if (status === "reading") return "ʕ◉ᴥ◉ʔ";
  return "ʕ•ᴥ•ʔ";
};

// Unified chat message component for both user and assistant messages
const ChatMessage = ({ messageData, onDelete, onRegenerate }) => {
  const {
    sender,
    name,
    avatarIcon,
    message,
    tabs,
    highlightedText,
    currentTabId,
    status,
    id,
  } = messageData;

  const isAssistant = sender === "assistant";

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
            {tabs &&
              tabs.length > 0 &&
              [...tabs].map((tab) => (
                <div key={tab.id}>
                  <TabDisplayWithHover tab={tab} />
                </div>
              ))}
          </div>
        </div>
      )}

      <div className="prose prose-sm prose-invert max-w-none">
        <MemoizedMarkdown content={message} id={id} tabs={tabs} />
      </div>

      {!isAssistant && (
        <div className="flex flex-wrap border-l-2 pl-3 text-sm gap-1 text-muted-foreground">
          {tabs &&
            tabs.length > 0 &&
            [...tabs]
              .sort((a, b) => {
                // First prioritize the current tab
                if (a.id && a.id.toString() === currentTabId?.toString())
                  return -1;
                if (b.id && b.id.toString() === currentTabId?.toString())
                  return 1;

                // Then prioritize tabs with highlights
                const aHasHighlight =
                  highlightedText && a.id && highlightedText[a.id.toString()];
                const bHasHighlight =
                  highlightedText && b.id && highlightedText[b.id.toString()];
                if (aHasHighlight && !bHasHighlight) return -1;
                if (!aHasHighlight && bHasHighlight) return 1;
                return 0;
              })
              .map((tab) => (
                <div
                  className={`${
                    highlightedText &&
                    tab.id &&
                    highlightedText[tab.id.toString()] !== ""
                      ? "w-full"
                      : ""
                  }`}
                  key={tab.id}
                >
                  <TabDisplayWithHover
                    tab={tab}
                    hasHighlight={
                      highlightedText && tab.id
                        ? highlightedText[tab.id.toString()]
                        : null
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

const ChatContent = ({ chatHistory, bottomRef, onDeleteMessage, onRegenerateMessage }) => {
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
