"use client";

import {
  ChevronDown,
  RefreshCw,
  Play,
  List,
  Download,
  Link,
  Maximize2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSerialStore } from "@/stores/serial";
import { SimulationControls } from "./simulation-controls";
import { SearchBar } from "./search-bar";
import { ThemeToggle } from "./theme-toggle";
import { KeyboardShortcuts } from "./keyboard-shortcuts";
import { SettingsPanel } from "./settings-panel";
import { useMediaQuery } from "react-responsive";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState, useEffect, useMemo } from "react";

export function Toolbar() {
  const {
    isMonitoring,
    setIsMonitoring,
    serialMode,
    setSerialMode,
    viewMode,
    setViewMode,
    lineEnding,
    setLineEnding,
    addTerminalData,
    clearTerminalData,
    isSimulationMode,
    showTimestamps,
    setShowTimestamps,
    tabs,
    activeTabId,
    setPort,
    setBaudRate,
    accentColor,
    toggleFullscreen,
    isFullscreen,
  } = useSerialStore();

  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [availablePorts, setAvailablePorts] = useState([
    "/dev/ttyS0",
    "/dev/ttyUSB0",
    "/dev/ttyACM0",
    "COM1",
    "COM2",
    "COM3",
  ]);

  // Get active tab
  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId),
    [tabs, activeTabId]
  );

  // Simulate port scanning
  useEffect(() => {
    // In a real app, this would scan for available ports periodically
    const interval = setInterval(() => {
      // Randomly add or remove a port to simulate device connection/disconnection
      if (Math.random() > 0.8) {
        const newPort = `COM${Math.floor(Math.random() * 10)}`;
        if (!availablePorts.includes(newPort)) {
          setAvailablePorts((prev) => [...prev, newPort]);
        } else {
          setAvailablePorts((prev) => prev.filter((p) => p !== newPort));
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [availablePorts]);

  const handleStartMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    if (!isMonitoring) {
      addTerminalData(
        `--- 开始监视 ${activeTab?.port} @ ${activeTab?.baudRate}bps ---`
      );
      if (isSimulationMode) {
        addTerminalData("模拟模式已激活。输入 'help' 查看可用命令。");
      }
    } else {
      addTerminalData("--- 停止监视 ---");
    }
  };

  const handleRefresh = () => {
    addTerminalData("--- 刷新端口列表 ---");
    // Simulate finding new ports
    const mockPorts = [
      "/dev/ttyS0",
      "/dev/ttyUSB0",
      "/dev/ttyACM0",
      "COM1",
      "COM2",
      "COM3",
      `COM${Math.floor(Math.random() * 10)}`,
    ];
    setAvailablePorts(mockPorts);
  };

  const handleClear = () => {
    clearTerminalData();
  };

  const handleSaveToFile = () => {
    addTerminalData("--- 保存终端输出到文件 ---");
    // In a real app, this would save the terminal output to a file

    // Create text content from terminal data
    const activeTabData = activeTab?.terminalData || [];
    const textContent = activeTabData
      .map((item) => {
        const timestamp = showTimestamps
          ? new Date(item.timestamp).toLocaleTimeString() + " "
          : "";
        return timestamp + item.text;
      })
      .join("\n");

    // Create and download file
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `serial-log-${new Date().toISOString().slice(0, 19)}.txt`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  // Mobile toolbar with dropdown for settings
  if (isMobile) {
    return (
      <div className="flex items-center p-2 gap-2 border-b border-gray-700 dark:border-gray-800 flex-wrap transition-colors duration-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-8 bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200"
            >
              设置 <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200">
            <DropdownMenuLabel>串口设置</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-700 dark:bg-gray-600" />

            <DropdownMenuGroup>
              <DropdownMenuItem>
                <div className="flex flex-col w-full">
                  <span className="text-sm">监视模式</span>
                  <Select value={serialMode} onValueChange={setSerialMode}>
                    <SelectTrigger className="w-full mt-1 h-8 bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700">
                      <SelectValue placeholder="Serial" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="serial">Serial</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem>
                <div className="flex flex-col w-full">
                  <span className="text-sm">查看模式</span>
                  <Select value={viewMode} onValueChange={setViewMode}>
                    <SelectTrigger className="w-full mt-1 h-8 bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700">
                      <SelectValue placeholder="文本" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="text">文本</SelectItem>
                      <SelectItem value="hex">Hex</SelectItem>
                      <SelectItem value="mixed">混合</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem>
                <div className="flex flex-col w-full">
                  <span className="text-sm">端口</span>
                  <Select value={activeTab?.port} onValueChange={setPort}>
                    <SelectTrigger className="w-full mt-1 h-8 bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700">
                      <SelectValue placeholder="/dev/ttyS0" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700">
                      {availablePorts.map((port) => (
                        <SelectItem key={port} value={port}>
                          {port}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem>
                <div className="flex flex-col w-full">
                  <span className="text-sm">波特率</span>
                  <Select
                    value={activeTab?.baudRate}
                    onValueChange={setBaudRate}
                  >
                    <SelectTrigger className="w-full mt-1 h-8 bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700">
                      <SelectValue placeholder="115200" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="9600">9600</SelectItem>
                      <SelectItem value="19200">19200</SelectItem>
                      <SelectItem value="38400">38400</SelectItem>
                      <SelectItem value="57600">57600</SelectItem>
                      <SelectItem value="115200">115200</SelectItem>
                      <SelectItem value="230400">230400</SelectItem>
                      <SelectItem value="460800">460800</SelectItem>
                      <SelectItem value="921600">921600</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem>
                <div className="flex flex-col w-full">
                  <span className="text-sm">行尾</span>
                  <Select value={lineEnding} onValueChange={setLineEnding}>
                    <SelectTrigger className="w-full mt-1 h-8 bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700">
                      <SelectValue placeholder="无" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700">
                      <SelectItem value="none">无</SelectItem>
                      <SelectItem value="nl">NL</SelectItem>
                      <SelectItem value="cr">CR</SelectItem>
                      <SelectItem value="crnl">CR+NL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator className="bg-gray-700 dark:bg-gray-600" />
            <DropdownMenuLabel>显示选项</DropdownMenuLabel>

            <DropdownMenuCheckboxItem
              checked={showTimestamps}
              onCheckedChange={setShowTimestamps}
            >
              显示时间戳
            </DropdownMenuCheckboxItem>

            <DropdownMenuCheckboxItem
              checked={isFullscreen}
              onCheckedChange={toggleFullscreen}
            >
              全屏模式
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          className={cn(
            "h-8 text-white transition-colors duration-200",
            isMonitoring ? "bg-red-600 hover:bg-red-700" : getAccentColorClass()
          )}
          onClick={handleStartMonitoring}
        >
          <Play className="h-4 w-4 mr-1" />
          {isMonitoring ? "停止监视" : "开始监视"}
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-[#1a2b3d] border-[#2a3b4d] dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200"
          onClick={handleRefresh}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-[#1a2b3d] border-[#2a3b4d] dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200"
          onClick={handleClear}
        >
          <List className="h-4 w-4" />
        </Button>

        <SearchBar />

        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-8 w-8 bg-[#1a2b3d] border-[#2a3b4d] dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200",
            showTimestamps && "border-purple-600 dark:border-purple-500"
          )}
          onClick={() => setShowTimestamps(!showTimestamps)}
        >
          <Clock className="h-4 w-4" />
        </Button>

        <SimulationControls />

        <KeyboardShortcuts />

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-[#1a2b3d] border-[#2a3b4d] dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200"
          onClick={handleSaveToFile}
        >
          <Download className="h-4 w-4" />
        </Button>

        <ThemeToggle />

        <SettingsPanel />
      </div>
    );
  }

  // Desktop toolbar
  return (
    <div className="flex items-center p-2 gap-2 border-b border-gray-700 dark:border-gray-800 overflow-x-auto transition-colors duration-200">
      <div className="flex items-center mr-2">
        <span className="text-sm mr-1">监视模式</span>
        <div className="relative inline-block">
          <Select value={serialMode} onValueChange={setSerialMode}>
            <SelectTrigger className="w-[100px] h-8 bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200">
              <SelectValue placeholder="Serial" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200">
              <SelectItem value="serial">Serial</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center mr-2">
        <span className="text-sm mr-1">查看模式</span>
        <div className="relative inline-block">
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-[100px] h-8 bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200">
              <SelectValue placeholder="文本" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200">
              <SelectItem value="text">文本</SelectItem>
              <SelectItem value="hex">Hex</SelectItem>
              <SelectItem value="mixed">混合</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center mr-2">
        <span className="text-sm mr-1">端口</span>
        <div className="relative inline-block">
          <Select value={activeTab?.port} onValueChange={setPort}>
            <SelectTrigger className="w-[140px] h-8 bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200">
              <SelectValue placeholder="/dev/ttyS0" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200">
              {availablePorts.map((port) => (
                <SelectItem key={port} value={port}>
                  {port}
                </SelectItem>
              ))}
              <SelectItem value="custom">
                <span className="text-gray-400">自定义...</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-[#1a2b3d] border-[#2a3b4d] dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>刷新端口列表</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="flex items-center mr-2">
        <span className="text-sm mr-1">波特率</span>
        <div className="relative inline-block">
          <Select value={activeTab?.baudRate} onValueChange={setBaudRate}>
            <SelectTrigger className="w-[100px] h-8 bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200">
              <SelectValue placeholder="115200" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200">
              <SelectItem value="9600">9600</SelectItem>
              <SelectItem value="19200">19200</SelectItem>
              <SelectItem value="38400">38400</SelectItem>
              <SelectItem value="57600">57600</SelectItem>
              <SelectItem value="115200">115200</SelectItem>
              <SelectItem value="230400">230400</SelectItem>
              <SelectItem value="460800">460800</SelectItem>
              <SelectItem value="921600">921600</SelectItem>
              <SelectItem value="custom">
                <span className="text-gray-400">自定义...</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center mr-2">
        <span className="text-sm mr-1">行尾</span>
        <div className="relative inline-block">
          <Select value={lineEnding} onValueChange={setLineEnding}>
            <SelectTrigger className="w-[100px] h-8 bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200">
              <SelectValue placeholder="无" />
            </SelectTrigger>
            <SelectContent className="bg-[#1a2b3d] border-[#2a3b4d] text-white dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200">
              <SelectItem value="none">无</SelectItem>
              <SelectItem value="nl">NL</SelectItem>
              <SelectItem value="cr">CR</SelectItem>
              <SelectItem value="crnl">CR+NL</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        className={cn(
          "h-8 text-white transition-colors duration-200",
          isMonitoring ? "bg-red-600 hover:bg-red-700" : getAccentColorClass()
        )}
        onClick={handleStartMonitoring}
      >
        <Play className="h-4 w-4 mr-1" />
        {isMonitoring ? "停止监视" : "开始监视"}
      </Button>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-[#1a2b3d] border-[#2a3b4d] dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200"
              onClick={handleClear}
            >
              <List className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>清除终端 (Ctrl+L)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <SearchBar />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-8 w-8 bg-[#1a2b3d] border-[#2a3b4d] dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200",
                showTimestamps && "border-purple-600 dark:border-purple-500"
              )}
              onClick={() => setShowTimestamps(!showTimestamps)}
            >
              <Clock className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>显示时间戳 (Ctrl+T)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <SimulationControls />

      <KeyboardShortcuts />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-[#1a2b3d] border-[#2a3b4d] dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200"
              onClick={handleSaveToFile}
            >
              <Download className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>保存到文件</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-[#1a2b3d] border-[#2a3b4d] dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200"
            >
              <Link className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>连接历史</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-8 w-8 bg-[#1a2b3d] border-[#2a3b4d] dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200",
                isFullscreen && "border-purple-600 dark:border-purple-500"
              )}
              onClick={toggleFullscreen}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>全屏模式 (Ctrl+F)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ThemeToggle />

      <SettingsPanel />
    </div>
  );
}
