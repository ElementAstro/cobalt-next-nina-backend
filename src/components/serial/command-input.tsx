"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  type KeyboardEvent,
} from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, ArrowUp, ArrowDown, Zap } from "lucide-react";
import { useSerialStore } from "@/stores/serial";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function CommandInput() {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  const {
    sendData,
    isMonitoring,
    navigateCommandHistory,
    commandHistory,
    macros,
    executeMacro,
    accentColor,
  } = useSerialStore();

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Common commands for suggestions
  const commonCommands = useMemo(
    () => [
      "help",
      "status",
      "version",
      "reset",
      "sensor",
      "connect",
      "disconnect",
      "scan",
      "list",
    ],
    []
  );

  // Update suggestions when input changes
  useEffect(() => {
    if (inputValue.trim()) {
      const matchingCommands = commonCommands.filter((cmd) =>
        cmd.toLowerCase().startsWith(inputValue.toLowerCase())
      );

      const matchingHistory = commandHistory
        .filter((cmd) => cmd.toLowerCase().startsWith(inputValue.toLowerCase()))
        .slice(0, 3);

      const uniqueSuggestions = Array.from(
        new Set([...matchingCommands, ...matchingHistory])
      ).slice(0, 5);

      setSuggestions(uniqueSuggestions);
      setShowSuggestions(uniqueSuggestions.length > 0);
      setSelectedSuggestionIndex(0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, commandHistory, commonCommands]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = () => {
    if (inputValue.trim() && isMonitoring) {
      sendData(inputValue);
      setInputValue("");
      setShowSuggestions(false);

      // Focus back on input after sending
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        if (suggestions[selectedSuggestionIndex]) {
          setInputValue(suggestions[selectedSuggestionIndex]);
          setShowSuggestions(false);
        }
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    } else {
      if (e.key === "Enter") {
        handleSend();
      } else if (e.key === "ArrowUp") {
        const command = navigateCommandHistory("up");
        if (command) setInputValue(command);
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        const command = navigateCommandHistory("down");
        setInputValue(command);
        e.preventDefault();
      } else if (e.key === "Tab") {
        e.preventDefault();
        setShowSuggestions(true);
      }
    }
  };

  const handleSpecialCommand = (command: string) => {
    sendData(command);
  };

  // Get accent color class
  const getAccentColorClass = () => {
    switch (accentColor) {
      case "blue":
        return "bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800";
      case "green":
        return "bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800";
      case "orange":
        return "bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800";
      case "red":
        return "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800";
      case "pink":
        return "bg-pink-600 hover:bg-pink-700 dark:bg-pink-700 dark:hover:bg-pink-800";
      default:
        return "bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800";
    }
  };

  return (
    <div className="flex items-center p-2 border-t border-gray-700 dark:border-gray-800 transition-colors duration-200">
      <div className="flex-grow flex items-center gap-2">
        <div className="relative flex-grow">
          <Input
            ref={inputRef}
            className="bg-[#1a2b3d] border-[#2a3b4d] text-white h-10 pr-16 dark:bg-gray-800 dark:border-gray-700 rounded-md transition-colors duration-200"
            placeholder="请输入要发送到串口的数据..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isMonitoring}
            autoComplete="off"
          />

          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                ref={suggestionsRef}
                className="absolute left-0 right-0 top-full mt-1 bg-[#1a2b3d] dark:bg-gray-800 border border-[#2a3b4d] dark:border-gray-700 rounded-md shadow-lg z-10"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
              >
                {suggestions.map((suggestion, index) => (
                  <div
                    key={suggestion}
                    className={cn(
                      "px-3 py-2 cursor-pointer hover:bg-[#2a3b4d] dark:hover:bg-gray-700",
                      index === selectedSuggestionIndex &&
                        "bg-[#2a3b4d] dark:bg-gray-700"
                    )}
                    onClick={() => {
                      setInputValue(suggestion);
                      setShowSuggestions(false);
                      inputRef.current?.focus();
                    }}
                  >
                    {suggestion}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {commandHistory.length > 0 && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-400 hover:text-white"
                      onClick={() => {
                        const command = navigateCommandHistory("up");
                        if (command) setInputValue(command);
                      }}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Previous command</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-400 hover:text-white"
                      onClick={() => {
                        const command = navigateCommandHistory("down");
                        setInputValue(command);
                      }}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Next command</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>

        <Button
          className={cn(
            "h-10 w-10 text-white transition-colors duration-200",
            getAccentColorClass()
          )}
          onClick={handleSend}
          disabled={!isMonitoring}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <div className="ml-2 flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200"
            >
              <Zap className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200">
            <DropdownMenuLabel>快捷命令</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-700 dark:bg-gray-600" />
            <DropdownMenuGroup>
              {macros.map((macro) => (
                <DropdownMenuItem
                  key={macro.id}
                  onClick={() => executeMacro(macro.id)}
                  disabled={!isMonitoring}
                >
                  {macro.name}
                  {macro.shortcut && (
                    <span className="ml-auto text-xs text-gray-400">
                      {macro.shortcut}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-gray-700 dark:bg-gray-600" />
            <DropdownMenuLabel>特殊命令</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => handleSpecialCommand("^C")}>
                发送 Ctrl + C
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSpecialCommand("^D")}>
                发送 Ctrl + D
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSpecialCommand("^Z")}>
                发送 Ctrl + Z
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
