import React from "react";
import { BrowserTab } from "@/utils/browser-tabs";
import { CachedContent, GroundingMetadata, Part } from "@google/genai";

// Define types for chat messages
export type MessageStatus = "streaming" | "reading" | "done";

// Base message interface with common properties
export interface BaseMessage {
  id: string;
  sender: "user" | "assistant";
  name: string;
  message: string;
  avatarIcon?: React.ReactNode | string;
  status?: MessageStatus;
  usedTabs?: number[];
  cachedContent?: Part | Part[];
  cached?: CachedContent;
  cacheSystemInstructions?: string;
}

// User-specific message properties
export interface UserMessage extends BaseMessage {
  sender: "user";
  highlightedText?: Record<number, string>;
  currentTabId?: number | null;
}

// Assistant-specific message properties
export interface AssistantMessage extends BaseMessage {
  sender: "assistant";
  readingTabs?: number[];
  tabs?: BrowserTab[];
  groundingMetadata?: GroundingMetadata
}

// Union type for all message types
export type ChatMessage = UserMessage | AssistantMessage;

// The chat history is an array of messages
export type ChatHistory = ChatMessage[];

export const isAssistantMessage = (message: UserMessage | AssistantMessage): message is AssistantMessage => {
  return message.sender === "assistant";
};