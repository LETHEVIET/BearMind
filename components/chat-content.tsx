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
  Info,
  Search,
} from "lucide-react"; // Added Search icon
import { TabDisplayWithHover } from "./tab-display-with-hover";
import {
  ChatHistory,
  UserMessage,
  AssistantMessage,
  isAssistantMessage,
} from "@/entrypoints/sidepanel/types";
import { useAppContext } from "./AppContext"; // Import the AppContext hook
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";
import { Separator } from "./ui/separator";
import { GroundingMetadata } from '@google/genai';

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
  lastMessage: boolean;
}

// Interface for the ActionButtons component
interface ActionButtonsProps {
  onRegenerate: () => void;
  message: string;
}

// New component to display grounding metadata
interface GroundingInfoProps {
  metadata: GroundingMetadata;
}

const GroundingInfo = ({ metadata }: GroundingInfoProps) => {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();

  if (!metadata) return null;
  
  return (
    <div className="mt-2 border rounded-md p-2 bg-background/50 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Search className="h-3 w-3" />
          <span>Web Search Results</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 w-5 p-0"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </Button>
      </div>
      
      {metadata.webSearchQueries && (
        <div className="mt-1 flex flex-wrap gap-1">
          {metadata.webSearchQueries.map((query, i) => (
            <div key={i} className="bg-muted px-2 py-1 rounded-full text-xs">
              {query}
            </div>
          ))}
        </div>
      )}
      
      {expanded && (
        <>
          {metadata.groundingChunks && metadata.groundingChunks.length > 0 && (
            <div className="mt-2">
              <div className="font-medium mb-1">Sources:</div>
              <div className="space-y-1">
                {metadata.groundingChunks.map((chunk, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <Globe className="h-3 w-3 text-muted-foreground" />
                    <a
                      href={chunk.web?.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      {chunk.web?.title || "Source " + (i + 1)}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {metadata.groundingSupports && metadata.groundingSupports.length > 0 && (
            <div className="mt-2">
              <div className="font-medium mb-1">Grounding details:</div>
              <div className="space-y-2">
                {metadata.groundingSupports.map((support, i) => (
                  <div key={i} className="border-l-2 border-muted pl-2">
                    <div className="italic text-muted-foreground">
                      "{support.segment?.text}"
                    </div>
                    <div className="text-xs mt-1">
                      Confidence: {support.confidenceScores?.[0] ? 
                        Math.round(support.confidenceScores[0] * 100) + '%' : 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

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
const ChatMessage = ({
  messageData,
  onDelete,
  onRegenerate,
  lastMessage
}: ChatMessageProps) => {
  const isAssistant = isAssistantMessage(messageData);
  const { id, name, message, avatarIcon, status, usedTabs } = messageData;
  const { session } = useAppContext(); // Assuming you have a session context
  let groundingMetadata = undefined;
  if (isAssistant && messageData.groundingMetadata) {
    groundingMetadata = messageData.groundingMetadata;
  }

  
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
          <div className="flex flex-wrap border-l-2 pl-3   gap-1 text-muted-foreground">
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

      <MemoizedMarkdown content={message} id={id} />

      {isAssistant && groundingMetadata && Object.keys(groundingMetadata).length !== 0 && (
        <GroundingInfo metadata={groundingMetadata} />
      )}

      {!isAssistant && (
        <div className="flex flex-wrap border-l-2 pl-3   gap-1 text-muted-foreground">
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
                  messageData.highlightedText &&
                  a &&
                  messageData.highlightedText[a];
                const bHasHighlight =
                  messageData.highlightedText &&
                  b &&
                  messageData.highlightedText[b];
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

      {isAssistant && (
        <div className="flex justify-between items-center w-full">
          <div>
            {status === "done" && (
              <ActionButtons
                onRegenerate={() => onRegenerate(id)}
                message={message}
              />
            )}
          </div>
          <div>
            {lastMessage && session.usageMetadata && (
              <div className="text-xs text-muted-foreground">
                {/* <p>{t("usage")}:</p> */}
                <div className="flex flex-wrap items-center gap-1">
                  {session.usageMetadata.totalTokenCount !== undefined && (
                    <span className="">
                      Total: {session.usageMetadata.totalTokenCount} toks
                    </span>
                  )}
                  <Separator orientation="vertical" className="h-3" />
                  {session.usageMetadata.promptTokenCount !== undefined && (
                    <span className="">
                      Prompt: {session.usageMetadata.promptTokenCount} toks
                    </span>
                  )}

                  <Separator orientation="vertical" className="h-3" />

                  {session.usageMetadata.candidatesTokenCount !== undefined && (
                    <span className="">
                      Response: {session.usageMetadata.candidatesTokenCount}{" "}
                      toks
                    </span>
                  )}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="no"
                          className="h-5 w-5 text-muted-foreground rounded-full hover:bg-muted hover:text-foreground flex items-center justify-center"
                        >
                          <Info className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="p-2 max-w-xs">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">
                            Token Usage Details
                          </p>
                          <div className="text-xs space-y-1">
                            {session.usageMetadata?.totalTokenCount !==
                              undefined && (
                              <div className="flex justify-between">
                                <span>Total tokens:</span>
                                <span className="font-medium">
                                  {session.usageMetadata.totalTokenCount}
                                </span>
                              </div>
                            )}
                            {session.usageMetadata?.promptTokenCount !==
                              undefined && (
                              <div className="flex justify-between">
                                <span>Input tokens:</span>
                                <span className="font-medium">
                                  {session.usageMetadata.promptTokenCount}
                                </span>
                              </div>
                            )}
                            {session.usageMetadata?.candidatesTokenCount !==
                              undefined && (
                              <div className="flex justify-between">
                                <span>Output tokens:</span>
                                <span className="font-medium">
                                  {session.usageMetadata.candidatesTokenCount}
                                </span>
                              </div>
                            )}
                            {session.usageMetadata.cachedContentTokenCount !==
                              undefined && (
                              <div>
                                <span className="">Cached:</span>
                                <span className="font-medium">
                                  {
                                    session.usageMetadata
                                      .cachedContentTokenCount
                                  }
                                </span>
                              </div>
                            )}
                            {session.usageMetadata.cacheTokensDetails && (
                              <div className="flex justify-between">
                                <span className="">Cache Details:</span>
                                <span className="font-medium">
                                  {JSON.stringify(
                                    session.usageMetadata.cacheTokensDetails
                                  )}
                                </span>
                              </div>
                            )}
                            {session.usageMetadata.candidatesTokensDetails && (
                              <div className="flex justify-between">
                                <span className="">Response Details:</span>
                                <span className="font-medium">
                                  {JSON.stringify(
                                    session.usageMetadata
                                      .candidatesTokensDetails
                                  )}
                                </span>
                              </div>
                            )}
                            {session.usageMetadata.promptTokensDetails && (
                              <div className="flex justify-between">
                                <span className="">Prompt Details:</span>
                                <span className="font-medium">
                                  {JSON.stringify(
                                    session.usageMetadata.promptTokensDetails
                                  )}
                                </span>
                              </div>
                            )}
                            {session.usageMetadata.thoughtsTokenCount !==
                              undefined && (
                              <div className="flex justify-between">
                                <span className="">Thoughts:</span>
                                <span className="font-medium">
                                  {session.usageMetadata.thoughtsTokenCount}
                                </span>
                              </div>
                            )}
                            {session.usageMetadata.toolUsePromptTokenCount !==
                              undefined && (
                              <div className="flex justify-between">
                                <span className="">Tool Use:</span>
                                <span className="font-medium">
                                  {
                                    session.usageMetadata
                                      .toolUsePromptTokenCount
                                  }
                                </span>
                              </div>
                            )}
                            {session.usageMetadata
                              .toolUsePromptTokensDetails && (
                              <div className="flex justify-between">
                                <span className="">Tool Details:</span>
                                <span className="font-medium">
                                  {JSON.stringify(
                                    session.usageMetadata
                                      .toolUsePromptTokensDetails
                                  )}
                                </span>
                              </div>
                            )}
                            {session.usageMetadata.trafficType !==
                              undefined && (
                              <div className="flex justify-between">
                                <span className="">
                                  {session.usageMetadata.trafficType}
                                </span>
                              </div>
                            )}

                            {session.selectedModel && (
                              <div className="pt-1 border-t border-border mt-1">
                                <span className="text-muted-foreground">
                                  Model: {session.selectedModel.name}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const StreamingAnimation = () => (
  <div className="flex   font-semibold text-foreground">
    {/* Animation code here */}
  </div>
);

const ChatContent = ({
  chatHistory,
  bottomRef,
  onDeleteMessage,
  onRegenerateMessage,
}: ChatContentProps) => {
  return (
    <div className="flex flex-col bg-background p-4">
      {chatHistory.map((messageData, i) => (
        <ChatMessage
          key={messageData.id}
          messageData={messageData}
          onDelete={onDeleteMessage}
          onRegenerate={onRegenerateMessage}
          lastMessage={i === chatHistory.length - 1}
        />
      ))}
      <StreamingAnimation />
      <div ref={bottomRef} />
      {/* This is the bottom ref for scrolling */}
    </div>
  );
};

export { ChatMessage, ChatContent };
