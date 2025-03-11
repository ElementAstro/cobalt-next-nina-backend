"use client";

import { useState } from "react";
import { useSerialStore } from "@/stores/serial";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Code, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ProtocolParserOptions } from "@/types/serial";
import { cn } from "@/lib/utils";

export function ProtocolAnalyzer() {
  const { activeTabId, tabs, setProtocolParser, protocolParser } =
    useSerialStore();
  const [isOpen, setIsOpen] = useState(false);
  const [parserType, setParserType] = useState<string>(
    protocolParser?.type || "modbus"
  );
  const [parserSettings, setParserSettings] = useState<Record<string, unknown>>(
    protocolParser?.settings || {}
  );
  const [customParserCode, setCustomParserCode] = useState<string>(
    protocolParser?.type === "custom" && protocolParser.customParser
      ? protocolParser.customParser.toString()
      : "function parseData(data) {\n  // data is a Uint8Array\n  return {\n    valid: true,\n    // your parsed data\n  };\n}"
  );

  // Get active tab
  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  // Apply parser when settings change
  const applyParser = () => {
    if (!activeTabId) return;

    let options: ProtocolParserOptions;

    if (parserType === "custom") {
      try {
        // Create a function from the custom parser code
        // eslint-disable-next-line no-new-func
        const customParserFn = new Function(
          "data",
          customParserCode.includes("return")
            ? customParserCode
            : `return ${customParserCode}`
        );

        options = {
          type: "custom",
          customParser: (data: Uint8Array) => customParserFn(data),
          settings: {
            description: "Custom Parser",
          },
        };
      } catch (error) {
        console.error("Error creating custom parser:", error);
        return;
      }
    } else {
      options = {
        type: parserType as "modbus" | "i2c" | "spi" | "can",
        settings: parserSettings,
      };
    }

    setProtocolParser(options);
  };

  // Reset parser
  const resetParser = () => {
    setProtocolParser(null);
  };

  // Export parsed data
  const exportParsedData = () => {
    if (!activeTab) return;

    // Get the last 100 parsed messages
    const parsedMessages = activeTab.parsedMessages || [];

    if (parsedMessages.length === 0) {
      return;
    }

    // Convert to JSON
    const jsonData = JSON.stringify(parsedMessages, null, 2);

    // Create and download file
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `protocol-data-${new Date().toISOString().slice(0, 19)}.json`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render MODBUS settings
  const renderModbusSettings = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="modbus-mode">MODBUS Mode</Label>
        <Select
          value={(parserSettings.mode as string) || "rtu"}
          onValueChange={(value) =>
            setParserSettings({ ...parserSettings, mode: value })
          }
        >
          <SelectTrigger
            id="modbus-mode"
            className="bg-[#1a2b3d] border-[#2a3b4d] text-white"
          >
            <SelectValue placeholder="RTU" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a2b3d] border-[#2a3b4d] text-white">
            <SelectItem value="rtu">RTU</SelectItem>
            <SelectItem value="ascii">ASCII</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Render I2C settings
  const renderI2CSettings = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="i2c-address-size">Address Size</Label>
        <Select
          value={parserSettings.addressSize?.toString() || "7"}
          onValueChange={(value) =>
            setParserSettings({
              ...parserSettings,
              addressSize: Number.parseInt(value),
            })
          }
        >
          <SelectTrigger
            id="i2c-address-size"
            className="bg-[#1a2b3d] border-[#2a3b4d] text-white"
          >
            <SelectValue placeholder="7-bit" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a2b3d] border-[#2a3b4d] text-white">
            <SelectItem value="7">7-bit</SelectItem>
            <SelectItem value="10">10-bit</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Render SPI settings
  const renderSPISettings = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="spi-mode">SPI Mode</Label>
        <Select
          value={parserSettings.mode?.toString() || "0"}
          onValueChange={(value) =>
            setParserSettings({
              ...parserSettings,
              mode: Number.parseInt(value),
            })
          }
        >
          <SelectTrigger
            id="spi-mode"
            className="bg-[#1a2b3d] border-[#2a3b4d] text-white"
          >
            <SelectValue placeholder="Mode 0" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a2b3d] border-[#2a3b4d] text-white">
            <SelectItem value="0">Mode 0 (CPOL=0, CPHA=0)</SelectItem>
            <SelectItem value="1">Mode 1 (CPOL=0, CPHA=1)</SelectItem>
            <SelectItem value="2">Mode 2 (CPOL=1, CPHA=0)</SelectItem>
            <SelectItem value="3">Mode 3 (CPOL=1, CPHA=1)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Render CAN settings
  const renderCANSettings = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="can-format">Frame Format</Label>
        <Select
          value={parserSettings.extended ? "extended" : "standard"}
          onValueChange={(value) =>
            setParserSettings({
              ...parserSettings,
              extended: value === "extended",
            })
          }
        >
          <SelectTrigger
            id="can-format"
            className="bg-[#1a2b3d] border-[#2a3b4d] text-white"
          >
            <SelectValue placeholder="Standard" />
          </SelectTrigger>
          <SelectContent className="bg-[#1a2b3d] border-[#2a3b4d] text-white">
            <SelectItem value="standard">Standard (11-bit)</SelectItem>
            <SelectItem value="extended">Extended (29-bit)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // Render custom parser settings
  const renderCustomSettings = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="custom-parser">Custom Parser Function</Label>
        <Textarea
          id="custom-parser"
          className="h-48 font-mono text-sm bg-[#1a2b3d] border-[#2a3b4d] text-white"
          value={customParserCode}
          onChange={(e) => setCustomParserCode(e.target.value)}
          placeholder="function parseData(data) {
  // data is a Uint8Array
  return {
    valid: true,
    // your parsed data
  };
}"
        />
      </div>
      <p className="text-xs text-gray-400">
        Write a function that takes a Uint8Array and returns an object with your
        parsed data. Include a &apos;valid&apos; property to indicate if parsing
        was successful.
      </p>
    </div>
  );

  // Render parser settings based on type
  const renderParserSettings = () => {
    switch (parserType) {
      case "modbus":
        return renderModbusSettings();
      case "i2c":
        return renderI2CSettings();
      case "spi":
        return renderSPISettings();
      case "can":
        return renderCANSettings();
      case "custom":
        return renderCustomSettings();
      default:
        return null;
    }
  };

  return (
    <div className="border-t border-gray-700 dark:border-gray-800 transition-colors duration-200">
      <div className="flex justify-between items-center p-2">
        <div className="font-medium text-white flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
          协议分析器
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 bg-[#1a2b3d] border-[#2a3b4d] dark:bg-gray-800 dark:border-gray-700 transition-colors duration-200"
            onClick={exportParsedData}
            disabled={!activeTab?.parsedMessages?.length}
          >
            <Download className="h-3 w-3 mr-1" />
            导出
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4">
              <Tabs defaultValue="configure" className="w-full">
                <TabsList className="bg-[#1a2b3d] dark:bg-gray-800 transition-colors duration-200">
                  <TabsTrigger
                    value="configure"
                    className="data-[state=active]:bg-[#2a3b4d] dark:data-[state=active]:bg-gray-700"
                  >
                    配置
                  </TabsTrigger>
                  <TabsTrigger
                    value="results"
                    className="data-[state=active]:bg-[#2a3b4d] dark:data-[state=active]:bg-gray-700"
                  >
                    结果
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="configure" className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="parser-type">协议类型</Label>
                        <Select
                          value={parserType}
                          onValueChange={setParserType}
                        >
                          <SelectTrigger
                            id="parser-type"
                            className="bg-[#1a2b3d] border-[#2a3b4d] text-white"
                          >
                            <SelectValue placeholder="选择协议" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a2b3d] border-[#2a3b4d] text-white">
                            <SelectItem value="modbus">MODBUS</SelectItem>
                            <SelectItem value="i2c">I2C</SelectItem>
                            <SelectItem value="spi">SPI</SelectItem>
                            <SelectItem value="can">CAN</SelectItem>
                            <SelectItem value="custom">自定义</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {renderParserSettings()}

                      <div className="flex gap-2 pt-4">
                        <Button onClick={applyParser}>
                          <Code className="h-4 w-4 mr-2" />
                          应用解析器
                        </Button>

                        <Button variant="outline" onClick={resetParser}>
                          重置
                        </Button>
                      </div>
                    </div>

                    <div className="bg-[#1a2b3d] p-4 rounded-md border border-[#2a3b4d]">
                      <h3 className="font-medium mb-2">协议说明</h3>
                      {parserType === "modbus" && (
                        <div className="text-sm text-gray-300 space-y-2">
                          <p>
                            MODBUS
                            是一种串行通信协议，广泛应用于工业自动化系统。
                          </p>
                          <p>支持的功能码:</p>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>0x01: 读线圈</li>
                            <li>0x02: 读离散输入</li>
                            <li>0x03: 读保持寄存器</li>
                            <li>0x04: 读输入寄存器</li>
                            <li>0x05: 写单个线圈</li>
                            <li>0x06: 写单个寄存器</li>
                            <li>0x0F: 写多个线圈</li>
                            <li>0x10: 写多个寄存器</li>
                          </ul>
                        </div>
                      )}

                      {parserType === "i2c" && (
                        <div className="text-sm text-gray-300 space-y-2">
                          <p>
                            I2C 是一种双线串行通信协议，常用于连接低速外设。
                          </p>
                          <p>特点:</p>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>使用 SDA（数据线）和 SCL（时钟线）</li>
                            <li>支持多主机和多从机</li>
                            <li>7位或10位寻址</li>
                            <li>
                              数据传输速率: 标准模式 (100 kbit/s)、快速模式 (400
                              kbit/s)、高速模式 (3.4 Mbit/s)
                            </li>
                          </ul>
                        </div>
                      )}

                      {parserType === "spi" && (
                        <div className="text-sm text-gray-300 space-y-2">
                          <p>SPI 是一种同步串行通信接口，用于短距离通信。</p>
                          <p>特点:</p>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>使用 SCLK、MOSI、MISO 和 SS 信号线</li>
                            <li>全双工通信</li>
                            <li>无地址机制，使用片选信号选择设备</li>
                            <li>
                              四种模式 (0-3)，基于时钟极性 (CPOL) 和相位 (CPHA)
                            </li>
                          </ul>
                        </div>
                      )}

                      {parserType === "can" && (
                        <div className="text-sm text-gray-300 space-y-2">
                          <p>
                            CAN
                            是一种用于车辆和工业控制的鲁棒性高的串行通信协议。
                          </p>
                          <p>特点:</p>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>高抗干扰能力</li>
                            <li>标准帧 (11位标识符) 和扩展帧 (29位标识符)</li>
                            <li>多主控制器网络</li>
                            <li>消息优先级</li>
                            <li>错误检测和恢复机制</li>
                          </ul>
                        </div>
                      )}

                      {parserType === "custom" && (
                        <div className="text-sm text-gray-300 space-y-2">
                          <p>
                            自定义解析器允许您编写自己的解析逻辑，以处理特定协议或数据格式。
                          </p>
                          <p>使用说明:</p>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>编写一个接受 Uint8Array 参数的函数</li>
                            <li>返回一个包含解析结果的对象</li>
                            <li>
                              包含 &apos;valid&apos; 属性以指示解析是否成功
                            </li>
                            <li>可以使用 JavaScript 的全部功能</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="results" className="mt-4">
                  {activeTab?.parsedMessages?.length ? (
                    <div className="space-y-4 max-h-96 overflow-auto">
                      {activeTab.parsedMessages
                        .slice(-50)
                        .map((message, index) => (
                          <div
                            key={index}
                            className={cn(
                              "p-3 rounded-md border text-sm font-mono",
                              message.valid
                                ? "border-green-600 bg-green-950/20"
                                : "border-red-600 bg-red-950/20"
                            )}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-xs text-gray-400">
                                {new Date(
                                  message.timestamp
                                ).toLocaleTimeString()}
                              </span>
                              <span
                                className={cn(
                                  "text-xs px-2 py-0.5 rounded",
                                  message.valid
                                    ? "bg-green-600/30"
                                    : "bg-red-600/30"
                                )}
                              >
                                {message.valid ? "Valid" : "Invalid"}
                              </span>
                            </div>
                            <pre className="whitespace-pre-wrap break-all">
                              {JSON.stringify(message.data, null, 2)}
                            </pre>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No parsed messages yet</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Apply a protocol parser and receive data to see results
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
