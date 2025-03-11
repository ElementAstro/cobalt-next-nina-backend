"use client"

import { useEffect, useRef, useCallback, useMemo } from "react"
import { useSerialStore } from "@/stores/serial"
import { useVirtualizer } from "@tanstack/react-virtual"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Highlight, themes } from "prism-react-renderer"

export function TerminalDisplay() {
  const { tabs, activeTabId, filteredTerminalData, isSimulationMode, searchTerm, showTimestamps, theme, accentColor } =
    useSerialStore()

  const parentRef = useRef<HTMLDivElement>(null)

  // Get active tab
  const activeTab = useMemo(() => tabs.find((tab) => tab.id === activeTabId), [tabs, activeTabId])

  // Get terminal data to display (filtered or all)
  const displayData = useMemo(
    () => (searchTerm ? filteredTerminalData : activeTab?.terminalData || []),
    [searchTerm, filteredTerminalData, activeTab],
  )

  // Create virtualizer
  const rowVirtualizer = useVirtualizer({
    count: displayData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 24, []),
    overscan: 20,
  })

  // Auto-scroll to bottom on new data (only if already at bottom)
  useEffect(() => {
    if (parentRef.current) {
      const { scrollHeight, scrollTop, clientHeight } = parentRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50

      if (isAtBottom || searchTerm) {
        rowVirtualizer.scrollToIndex(displayData.length - 1, { align: "end", behavior: "smooth" })
      }
    }
  }, [displayData.length, rowVirtualizer, searchTerm])

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  }

  // Handle highlighting search terms
  const highlightSearchTerm = (text: string) => {
    if (!searchTerm) return text

    const regex = new RegExp(`(${searchTerm})`, "gi")
    const parts = text.split(regex)

    return parts.map((part, index) =>
      part.toLowerCase() === searchTerm.toLowerCase() ? (
        <span key={index} className="bg-yellow-500 text-black dark:bg-yellow-600 dark:text-white px-0.5 rounded-sm">
          {part}
        </span>
      ) : (
        part
      ),
    )
  }

  // Determine text color based on message type
  const getTextColorClass = (text: string, type?: string) => {
    if (type === "command") return "text-green-400 dark:text-green-300"
    if (type === "response") return "text-blue-400 dark:text-blue-300"
    if (type === "error") return "text-red-400 dark:text-red-300"
    if (type === "warning") return "text-yellow-400 dark:text-yellow-300"

    // Legacy detection
    if (text.startsWith("ERROR")) return "text-red-400 dark:text-red-300"
    if (text.startsWith("WARNING")) return "text-yellow-400 dark:text-yellow-300"
    if (text.startsWith(">")) return "text-green-400 dark:text-green-300"
    if (text.startsWith("---")) return "text-blue-400 dark:text-blue-300 font-bold"

    return "text-white dark:text-gray-200"
  }

  // Syntax highlighting for code blocks
  const renderWithSyntaxHighlighting = (text: string) => {
    // Check if this looks like code (contains brackets, semicolons, etc.)
    const looksLikeCode = /[{};]/.test(text) && text.length > 20

    if (!looksLikeCode) return highlightSearchTerm(text)

    return (
      <Highlight theme={theme === "dark" ? themes.vsDark : themes.vsLight} code={text} language="javascript">
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={cn(className, "text-sm")} style={style}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    )
  }

  // Get accent color class
  const getAccentColorClass = () => {
    switch (accentColor) {
      case "blue":
        return "bg-blue-600 dark:bg-blue-700"
      case "green":
        return "bg-green-600 dark:bg-green-700"
      case "orange":
        return "bg-orange-600 dark:bg-orange-700"
      case "red":
        return "bg-red-600 dark:bg-red-700"
      case "pink":
        return "bg-pink-600 dark:bg-pink-700"
      default:
        return "bg-purple-600 dark:bg-purple-700"
    }
  }

  return (
    <div
      ref={parentRef}
      className={cn(
        "flex-grow p-2 overflow-auto font-mono text-sm",
        isSimulationMode ? "bg-[#0a1929]" : "bg-[#0a1929]",
        "dark:bg-gray-900 transition-colors duration-200",
      )}
      style={{ height: "100%" }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => {
          const item = displayData[virtualItem.index]
          if (!item) return null

          return (
            <div
              key={item.id}
              data-index={virtualItem.index}
              className={cn(
                "absolute top-0 left-0 mb-1 w-full",
                getTextColorClass(item.text, item.type),
                "transition-colors duration-200",
              )}
              style={{
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {showTimestamps && (
                <span className="text-gray-500 dark:text-gray-400 text-xs mr-2 select-none">
                  {formatTime(item.timestamp)}
                </span>
              )}
              {renderWithSyntaxHighlighting(item.text)}
            </div>
          )
        })}
      </div>

      {displayData.length === 0 && (
        <div className="flex flex-col justify-center items-center h-full text-gray-400 dark:text-gray-500 space-y-4">
          <div className={cn("p-4 rounded-full", getAccentColorClass())}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"></path>
              <path d="M6 18h12"></path>
              <path d="M6 14h12"></path>
              <rect x="6" y="10" width="12" height="2"></rect>
            </svg>
          </div>
          <div className="text-center">
            {searchTerm ? (
              <>
                <p className="text-lg font-medium">No results found</p>
                <p className="text-sm">Try a different search term</p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium">No terminal output</p>
                <p className="text-sm">Start monitoring to see data</p>
              </>
            )}
          </div>
          {!searchTerm && (
            <Badge variant="outline" className="mt-2">
              Press Ctrl+M to start monitoring
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

