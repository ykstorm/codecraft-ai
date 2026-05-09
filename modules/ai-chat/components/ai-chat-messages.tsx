"use client";

import React from "react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Loader2, Copy, RefreshCw, User, Brain } from "lucide-react";
import "katex/dist/katex.min.css";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  id: string;
  timestamp: Date;
  type?: "chat" | "code_review" | "suggestion" | "error_fix" | "optimization";
  tokens?: number;
  model?: string;
}

interface MessageTypeIndicatorProps {
  type?: string;
  model?: string;
  tokens?: number;
}

const MessageTypeIndicator: React.FC<MessageTypeIndicatorProps> = ({
  type,
  model,
  tokens,
}) => {
  const getTypeConfig = (type?: string) => {
    switch (type) {
      case "code_review":
        return { icon: Code, color: "text-blue-400", label: "Code Review" };
      case "suggestion":
        return {
          icon: Sparkles,
          color: "text-purple-400",
          label: "Suggestion",
        };
      case "error_fix":
        return { icon: RefreshCw, color: "text-red-400", label: "Error Fix" };
      case "optimization":
        return { icon: Zap, color: "text-yellow-400", label: "Optimization" };
      default:
        return { icon: MessageSquare, color: "text-zinc-400", label: "Chat" };
    }
  };

  const config = getTypeConfig(type);
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1">
        <Icon className={cn("h-3 w-3", config.color)} />
        <span className={cn("text-xs font-medium", config.color)}>
          {config.label}
        </span>
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        {model && <span>{model}</span>}
        {tokens && <span>{tokens} tokens</span>}
      </div>
    </div>
  );
};

interface AIChatMessagesProps {
  messages: ChatMessage[];
  isLoading: boolean;
  chatMode: string;
  searchTerm: string;
  filterType: string;
  onInputChange?: (content: string) => void;
  messagesEndRef?: React.RefObject<HTMLDivElement | null>;
}

export const AIChatMessages: React.FC<AIChatMessagesProps> = ({
  messages,
  isLoading,
  chatMode,
  searchTerm,
  filterType,
  messagesEndRef,
}) => {
  const filteredMessages = messages
    .filter((msg) => {
      if (filterType === "all") return true;
      return msg.type === filterType;
    })
    .filter((msg) => {
      if (!searchTerm) return true;
      return msg.content.toLowerCase().includes(searchTerm.toLowerCase());
    });

  const getLoadingMessage = () => {
    switch (chatMode) {
      case "review":
        return "Analyzing code structure and patterns...";
      case "fix":
        return "Identifying issues and solutions...";
      case "optimize":
        return "Analyzing performance bottlenecks...";
      default:
        return "Processing your request...";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {filteredMessages.length === 0 && !isLoading && (
        <EmptyState />
      )}

      {filteredMessages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
        />
      ))}

      {isLoading && (
        <LoadingIndicator message={getLoadingMessage()} />
      )}

      <div ref={messagesEndRef} className="h-1" />
    </div>
  );
};

const EmptyState: React.FC = () => (
  <div className="text-center text-zinc-500 py-16">
    <div className="relative w-16 h-16 border rounded-full flex flex-col justify-center items-center mx-auto mb-4">
      <Brain className="h-8 w-8 text-zinc-400" />
    </div>
    <h3 className="text-xl font-semibold mb-3 text-zinc-300">
      Enhanced AI Assistant
    </h3>
    <p className="text-zinc-400 max-w-md mx-auto leading-relaxed mb-6">
      Advanced AI coding assistant with comprehensive analysis capabilities.
    </p>
    <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
      {[
        "Review my React component for performance",
        "Fix TypeScript compilation errors",
        "Optimize database query performance",
        "Add comprehensive error handling",
        "Implement security best practices",
        "Refactor code for better maintainability",
      ].map((suggestion) => (
        <button
          key={suggestion}
          onClick={() => {}}
          className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm text-zinc-300 transition-colors text-left"
        >
          {suggestion}
        </button>
      ))}
    </div>
  </div>
);

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex items-start gap-4 group",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="relative w-10 h-10 border rounded-full flex flex-col justify-center items-center">
          <Brain className="h-5 w-5 text-zinc-400" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-xl shadow-sm",
          isUser
            ? "bg-zinc-900/70 text-white p-4 rounded-br-md"
            : "bg-zinc-900/80 backdrop-blur-sm text-zinc-100 p-5 rounded-bl-md border border-zinc-800/50"
        )}
      >
        {!isUser && (
          <MessageTypeIndicator
            type={message.type}
            model={message.model}
            tokens={message.tokens}
          />
        )}

        <div className="prose prose-invert prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              code: ({ children, className }) => {
                const isBlock = className?.startsWith("language-");
                if (!isBlock) {
                  return (
                    <code className="bg-zinc-800 px-1 py-0.5 rounded text-sm">
                      {children}
                    </code>
                  );
                }
                return (
                  <div className="bg-zinc-800 rounded-lg p-4 my-4">
                    <pre className="text-sm text-zinc-100 overflow-x-auto">
                      <code className={className}>{children}</code>
                    </pre>
                  </div>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-700/30">
          <div className="text-xs text-zinc-500">
            {message.timestamp.toLocaleTimeString()}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigator.clipboard.writeText(message.content)}
              className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {}}
              className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-200"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {isUser && (
        <Avatar className="h-9 w-9 border border-zinc-700 bg-zinc-800 shrink-0">
          <AvatarFallback className="bg-zinc-700 text-zinc-300">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

interface LoadingIndicatorProps {
  message: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message }) => (
  <div className="flex items-start gap-4 justify-start">
    <div className="relative w-10 h-10 border rounded-full flex flex-col justify-center items-center">
      <Brain className="h-5 w-5 text-zinc-400" />
    </div>
    <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/50 p-5 rounded-xl rounded-bl-md flex items-center gap-3">
      <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
      <span className="text-sm text-zinc-300">{message}</span>
    </div>
  </div>
);

// Import additional icons
import { Code, Sparkles, MessageSquare, Zap } from "lucide-react";