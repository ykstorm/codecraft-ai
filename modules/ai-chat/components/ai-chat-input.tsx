"use client";

import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface AIChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  chatMode: string;
}

export const AIChatInput: React.FC<AIChatInputProps> = ({
  input,
  onInputChange,
  onSubmit,
  isLoading,
  chatMode,
}) => {
  const getPlaceholder = () => {
    switch (chatMode) {
      case "chat":
        return "Ask about your code, request improvements, or paste code to analyze...";
      case "review":
        return "Describe what you'd like me to review in your code...";
      case "fix":
        return "Describe the issue you're experiencing...";
      case "optimize":
        return "Describe what you'd like me to optimize...";
      default:
        return "Ask about your code, request improvements, or paste code to analyze...";
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="shrink-0 p-4 border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-sm"
    >
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <Textarea
            placeholder={getPlaceholder()}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                onSubmit(e as unknown as React.FormEvent);
              }
            }}
            disabled={isLoading}
            className="min-h-[44px] max-h-32 bg-zinc-800/50 border-zinc-700/50 text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:ring-blue-500/20 resize-none pr-20"
            rows={1}
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs text-zinc-500 bg-zinc-800 border border-zinc-700 rounded">
              ⌘↵
            </kbd>
          </div>
        </div>
        <Button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  );
};