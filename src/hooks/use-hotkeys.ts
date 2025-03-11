"use client";

import { useEffect, useCallback } from "react";
import { useSerialStore } from "@/stores/serial";
import { useToast } from "@/hooks/use-toast";

type HotkeyConfig = {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  description: string;
  action: () => void;
  global?: boolean;
};

export function useHotkeys() {
  const {
    setIsMonitoring,
    isMonitoring,
    clearTerminalData,
    toggleVisualization,
    toggleFullscreen,
    toggleTimestamps,
    toggleTheme,
    saveSession,
    activeTabId,
    switchTab,
    tabs,
    addTab,
    removeTab,
  } = useSerialStore();

  const { toast } = useToast();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Skip if in an input field and not marked as global
      const isInputActive =
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement;

      // Define all hotkeys
      const hotkeys: HotkeyConfig[] = [
        {
          key: "m",
          ctrl: true,
          description: "Toggle monitoring",
          action: () => setIsMonitoring(!isMonitoring),
          global: true,
        },
        {
          key: "l",
          ctrl: true,
          description: "Clear terminal",
          action: () => clearTerminalData(),
        },
        {
          key: "v",
          ctrl: true,
          description: "Toggle visualization",
          action: () => toggleVisualization(),
        },
        {
          key: "f",
          ctrl: true,
          description: "Toggle fullscreen",
          action: () => toggleFullscreen(),
          global: true,
        },
        {
          key: "t",
          ctrl: true,
          description: "Toggle timestamps",
          action: () => toggleTimestamps(),
        },
        {
          key: "d",
          ctrl: true,
          description: "Toggle theme",
          action: () => toggleTheme(),
          global: true,
        },
        {
          key: "s",
          ctrl: true,
          description: "Save session",
          action: () => {
            saveSession();
            toast({
              title: "Session saved",
              description: "Your session has been saved to local storage",
            });
          },
        },
        // Tab navigation
        {
          key: "1",
          ctrl: true,
          description: "Switch to tab 1",
          action: () => {
            if (tabs[0]) switchTab(tabs[0].id);
          },
          global: true,
        },
        {
          key: "2",
          ctrl: true,
          description: "Switch to tab 2",
          action: () => {
            if (tabs[1]) switchTab(tabs[1].id);
          },
          global: true,
        },
        {
          key: "3",
          ctrl: true,
          description: "Switch to tab 3",
          action: () => {
            if (tabs[2]) switchTab(tabs[2].id);
          },
          global: true,
        },
        {
          key: "t",
          ctrl: true,
          shift: true,
          description: "New tab",
          action: () => addTab(),
          global: true,
        },
        {
          key: "w",
          ctrl: true,
          description: "Close tab",
          action: () => {
            if (tabs.length > 1) removeTab(activeTabId);
          },
          global: true,
        },
        {
          key: "Tab",
          ctrl: true,
          description: "Next tab",
          action: () => {
            const currentIndex = tabs.findIndex(
              (tab) => tab.id === activeTabId
            );
            const nextIndex = (currentIndex + 1) % tabs.length;
            switchTab(tabs[nextIndex].id);
          },
          global: true,
        },
        {
          key: "Tab",
          ctrl: true,
          shift: true,
          description: "Previous tab",
          action: () => {
            const currentIndex = tabs.findIndex(
              (tab) => tab.id === activeTabId
            );
            const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            switchTab(tabs[prevIndex].id);
          },
          global: true,
        },
      ];

      // Check if any hotkey matches
      for (const hotkey of hotkeys) {
        if (
          e.key.toLowerCase() === hotkey.key.toLowerCase() &&
          !!e.ctrlKey === !!hotkey.ctrl &&
          !!e.altKey === !!hotkey.alt &&
          !!e.shiftKey === !!hotkey.shift &&
          (!isInputActive || hotkey.global)
        ) {
          e.preventDefault();
          hotkey.action();
          return;
        }
      }
    },
    [
      isMonitoring,
      setIsMonitoring,
      clearTerminalData,
      toggleVisualization,
      toggleFullscreen,
      toggleTimestamps,
      toggleTheme,
      saveSession,
      toast,
      activeTabId,
      switchTab,
      tabs,
      addTab,
      removeTab,
    ]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    getHotkeysList: () => [
      { key: "Ctrl+M", description: "Toggle monitoring" },
      { key: "Ctrl+L", description: "Clear terminal" },
      { key: "Ctrl+V", description: "Toggle visualization" },
      { key: "Ctrl+F", description: "Toggle fullscreen" },
      { key: "Ctrl+T", description: "Toggle timestamps" },
      { key: "Ctrl+D", description: "Toggle theme" },
      { key: "Ctrl+S", description: "Save session" },
      { key: "Ctrl+1-3", description: "Switch to tab" },
      { key: "Ctrl+Shift+T", description: "New tab" },
      { key: "Ctrl+W", description: "Close tab" },
      { key: "Ctrl+Tab", description: "Next tab" },
      { key: "Ctrl+Shift+Tab", description: "Previous tab" },
      { key: "↑/↓", description: "Navigate command history" },
    ],
  };
}
