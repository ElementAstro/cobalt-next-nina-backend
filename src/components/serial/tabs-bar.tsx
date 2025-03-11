"use client";

import type React from "react";

import { useState } from "react";
import { useSerialStore } from "@/stores/serial";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Edit2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SerialTab } from "@/types/serial/types";

export function TabsBar() {
  const {
    tabs,
    activeTabId,
    addTab,
    removeTab,
    renameTab,
    switchTab,
    accentColor,
  } = useSerialStore();
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleStartEditing = (tab: SerialTab, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTabId(tab.id);
    setEditingName(tab.name);
  };

  const handleFinishEditing = () => {
    if (editingTabId && editingName.trim()) {
      renameTab(editingTabId, editingName);
    }
    setEditingTabId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleFinishEditing();
    } else if (e.key === "Escape") {
      setEditingTabId(null);
    }
  };

  // Get accent color class
  const getAccentColorClass = () => {
    switch (accentColor) {
      case "blue":
        return "bg-blue-600 border-blue-700";
      case "green":
        return "bg-green-600 border-green-700";
      case "orange":
        return "bg-orange-600 border-orange-700";
      case "red":
        return "bg-red-600 border-red-700";
      case "pink":
        return "bg-pink-600 border-pink-700";
      default:
        return "bg-purple-600 border-purple-700";
    }
  };

  return (
    <div className="flex items-center border-b border-gray-700 dark:border-gray-800 bg-[#0a1929] dark:bg-gray-900 transition-colors duration-200 overflow-x-auto">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={cn(
            "flex items-center h-10 px-4 border-r border-gray-700 dark:border-gray-800 cursor-pointer group transition-colors duration-200",
            tab.id === activeTabId
              ? cn(getAccentColorClass(), "text-white")
              : "bg-[#1a2b3d] dark:bg-gray-800 text-gray-300 dark:text-gray-400 hover:bg-[#2a3b4d] dark:hover:bg-gray-700"
          )}
          onClick={() => switchTab(tab.id)}
        >
          {editingTabId === tab.id ? (
            <div
              className="flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Input
                className="h-6 w-32 bg-[#0a1929] dark:bg-gray-900 border-gray-700 dark:border-gray-800 text-white"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 ml-1"
                onClick={handleFinishEditing}
              >
                <Check className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              <span className="truncate max-w-[120px]">{tab.name}</span>

              <div className="flex items-center ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-white"
                  onClick={(e) => handleStartEditing(tab, e)}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>

                {tabs.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTab(tab.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      ))}

      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 text-gray-400 hover:text-white"
        onClick={addTab}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
