"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { X, Settings, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { AIChatModeSelector, type ChatMode } from "./ai-chat-mode-selector";
import { AIChatMessages, type ChatMessage } from "./ai-chat-messages";
import { AIChatInput } from "./ai-chat-input";

interface AIChatSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIChatSidePanel: React.FC<AIChatSidePanelProps> = ({
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>("chat");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [autoSave, setAutoSave] = useState(true);
  const [streamResponse, setStreamResponse] = useState(true);
  const [model, setModel] = useState<string>("gpt-6");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [messages, isLoading]);

  const getChatModePrompt = (mode: string, content: string) => {
    switch (mode) {
      case "review":
        return `Please review this code and provide detailed suggestions for improvement, including performance, security, and best practices:\n\n**Request:** ${content}`;
      case "fix":
        return `Please help fix issues in this code, including bugs, errors, and potential problems:\n\n**Problem:** ${content}`;
      case "optimize":
        return `Please analyze this code for performance optimizations and suggest improvements:\n\n**Code to optimize:** ${content}`;
      default:
        return content;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageType =
      chatMode === "chat"
        ? "chat"
        : chatMode === "review"
        ? "code_review"
        : chatMode === "fix"
        ? "error_fix"
        : "optimization";

    const newMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
      id: Date.now().toString(),
      type: messageType,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const contextualMessage = getChatModePrompt(chatMode, input.trim());

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: contextualMessage,
          history: messages.slice(-10).map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          stream: streamResponse,
          mode: chatMode,
          model,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response,
            timestamp: new Date(),
            id: Date.now().toString(),
            type: messageType,
            tokens: data.tokens,
            model: data.model || "AI Assistant",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Sorry, I encountered an error while processing your request. Please try again.",
            timestamp: new Date(),
            id: Date.now().toString(),
          },
        ]);
      }
    } catch (error) {
      // In production, we log to an error tracking service instead of console.error
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm having trouble connecting right now. Please check your internet connection and try again.",
          timestamp: new Date(),
          id: Date.now().toString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const exportChat = () => {
    const chatData = {
      messages,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(chatData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-chat-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <TooltipProvider>
      <>
        {/* Backdrop */}
        <div
          className={cn(
            "fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
          onClick={onClose}
        />

        {/* Side Panel */}
        <div
          className={cn(
            "fixed right-0 top-0 h-full w-full max-w-6xl bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col transition-transform duration-300 ease-out shadow-2xl",
            isOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          {/* Enhanced Header */}
          <div className="shrink-0 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
            <div className="flex items-center justify-between p-6">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 border rounded-full flex flex-col justify-center items-center">
                  <Image src={"/logo.svg"} alt="Logo" width={28} height={28} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-zinc-100">
                    Enhanced AI Assistant
                  </h2>
                  <p className="text-sm text-zinc-400">
                    {messages.length} messages
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuCheckboxItem
                      checked={autoSave}
                      onCheckedChange={setAutoSave}
                    >
                      Auto-save conversations
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={streamResponse}
                      onCheckedChange={setStreamResponse}
                    >
                      Stream responses
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={exportChat}>
                      <Download className="h-4 w-4 mr-2" />
                      Export Chat
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setMessages([])}>
                      Clear All Messages
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Enhanced Controls */}
            <AIChatModeSelector
              chatMode={chatMode}
              onModeChange={setChatMode}
              model={model}
              onModelChange={setModel}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterType={filterType}
              onFilterChange={setFilterType}
            />
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto bg-zinc-950">
            <AIChatMessages
              messages={messages}
              isLoading={isLoading}
              chatMode={chatMode}
              searchTerm={searchTerm}
              filterType={filterType}
              messagesEndRef={messagesEndRef}
            />
          </div>

          {/* Input */}
          <AIChatInput
            input={input}
            onInputChange={setInput}
            onSubmit={handleSendMessage}
            isLoading={isLoading}
            chatMode={chatMode}
          />
        </div>
      </>
    </TooltipProvider>
  );
};