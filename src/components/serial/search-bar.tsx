"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSerialStore } from "@/stores/serial";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function SearchBar() {
  const { searchTerm, setSearchTerm, filteredTerminalData, getTerminalData } =
    useSerialStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  return (
    <div className="relative flex items-center">
      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            className="flex items-center"
            initial={{ width: 32, opacity: 0 }}
            animate={{ width: 200, opacity: 1 }}
            exit={{ width: 32, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Input
              ref={inputRef}
              className="h-8 bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700 pr-8"
              placeholder="搜索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 h-8 w-8"
              onClick={() => {
                setSearchTerm("");
                setIsExpanded(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-[#1a2b3d] border-[#2a3b4d] dark:bg-gray-800 dark:border-gray-700"
              onClick={() => setIsExpanded(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {searchTerm && (
        <div className="absolute right-0 top-full mt-1 text-xs bg-[#1a2b3d] dark:bg-gray-800 px-2 py-1 rounded">
          {filteredTerminalData.length} / {getTerminalData().length} results
        </div>
      )}
    </div>
  );
}
