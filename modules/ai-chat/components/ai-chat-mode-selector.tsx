"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Search, Filter, Code, MessageSquare, RefreshCw, Zap } from "lucide-react";

export type ChatMode = "chat" | "review" | "fix" | "optimize";

interface AIChatModeSelectorProps {
  chatMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  model: string;
  onModelChange: (model: string) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filterType: string;
  onFilterChange: (filter: string) => void;
}

export const AIChatModeSelector: React.FC<AIChatModeSelectorProps> = ({
  chatMode,
  onModeChange,
  model,
  onModelChange,
  searchTerm,
  onSearchChange,
  filterType,
  onFilterChange,
}) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <Tabs
        value={chatMode}
        onValueChange={(value) => onModeChange(value as ChatMode)}
        className="px-6"
      >
        <TabsList className="grid w-full grid-cols-4 max-w-md">
          <TabsTrigger value="chat" className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="review" className="flex items-center gap-1">
            <Code className="h-3 w-3" />
            Review
          </TabsTrigger>
          <TabsTrigger value="fix" className="flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            Fix
          </TabsTrigger>
          <TabsTrigger value="optimize" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Optimize
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
          <span className="text-zinc-500">Model:</span>
          <select
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            className="bg-zinc-900/60 border border-zinc-800 rounded px-2 py-1 text-zinc-200 focus:outline-none"
          >
            <option value="gpt-6">gpt-6</option>
            <option value="codellama">codellama</option>
            <option value="llama2">llama2</option>
          </select>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-zinc-500" />
          <Input
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-7 h-8 w-40 bg-zinc-800/50 border-zinc-700/50"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Filter className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onFilterChange("all")}>
              All Messages
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterChange("chat")}>
              Chat Only
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterChange("code_review")}>
              Code Reviews
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterChange("error_fix")}>
              Error Fixes
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterChange("optimization")}>
              Optimizations
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};