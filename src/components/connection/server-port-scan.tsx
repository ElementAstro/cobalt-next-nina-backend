"use client";

import React, { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X, Download, List, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ScanHistory,
  usePortScanStore,
} from "@/stores/connection/portScanStore";
import logger from "@/utils/logger";

// Add Web Worker support
const scanWorker = new Worker(
  new URL("@/workers/port-scan.worker.ts", import.meta.url)
);

const commonPorts: { [key: number]: string } = {
  21: "FTP",
  22: "SSH",
  80: "HTTP",
  443: "HTTPS",
  3306: "MySQL",
  5432: "PostgreSQL",
  8080: "HTTP Alternate",
  27017: "MongoDB",
  6379: "Redis",
};

// Array chunking utility
const chunkArray = (array: number[], size: number): number[][] => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

interface ScanResult {
  port: number;
  status: "open" | "closed";
  service?: string;
}

type ScanSpeed = "fast" | "normal" | "thorough";

const ServerPortScanModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [isCancelled, setIsCancelled] = useState(false);
  const cancelRef = useRef(false);
  const [activeTab, setActiveTab] = useState("scan");
  const [showCustomRange, setShowCustomRange] = useState(false);

  const {
    progress,
    status,
    isScanning,
    scanResults,
    ipAddress,
    portRange,
    customPortRange,
    scanSpeed,
    timeout,
    concurrentScans,
    showClosedPorts,
    scanHistory,
    selectedInterface,
    setIpAddress,
    setPortRange,
    setProgress,
    setStatus,
    setIsScanning,
    setScanResults,
    setCustomPortRange,
    setScanSpeed,
    setTimeoutValue,
    setConcurrentScans,
    setShowClosedPorts,
    setScanHistory,
  } = usePortScanStore();

  // 验证IP地址
  const ipSchema = z
    .string()
    .min(1, "IP地址不能为空")
    .regex(
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
      "请输入有效的IPv4地址"
    );

  const validatePortRange = useCallback(
    (value: string) => {
      try {
        if (value === "custom") {
          const ranges = customPortRange.split(",");
          const isValid = ranges.every((range) => {
            const [start, end] = range.split("-").map(Number);
            return (
              !isNaN(start) &&
              !isNaN(end) &&
              start > 0 &&
              end <= 65535 &&
              start <= end
            );
          });

          if (!isValid) {
            throw new Error("自定义端口范围无效，请使用格式：1-100,200-300");
          }
        }
        return true;
      } catch (error: unknown) {
        const err = error as Error;
        toast({
          title: "验证错误",
          description: err.message,
          variant: "destructive",
        });
        return false;
      }
    },
    [customPortRange]
  );

  // Worker message handler
  React.useEffect(() => {
    if (!scanWorker) return;

    scanWorker.onmessage = (event) => {
      const { port, status, error } = event.data;
      if (error) {
        handleScanError(error);
        return;
      }
      updateScanResults(port, status);
      updateProgress();
    };

    return () => {
      scanWorker.terminate();
    };
  }, []);

  const handleScanError = useCallback(
    (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      logger.error("Port scan error:", error);
      setStatus("扫描出错");
      toast({
        title: "扫描错误",
        description: errorMessage || "端口扫描过程中发生错误",
        variant: "destructive",
      });
      setIsScanning(false);
    },
    [setStatus, setIsScanning]
  );

  const updateScanResults = useCallback(
    (port: number, scanStatus: string) => {
      const finalStatus = scanStatus === "open" ? "open" : "closed";
      const result = (prev: ScanResult[]) => {
        const newResults = [...prev];
        const existingIndex = newResults.findIndex((r) => r.port === port);
        const result: ScanResult = {
          port,
          status: finalStatus,
          service: finalStatus === "open" ? commonPorts[port] || "未知" : undefined,
        };

        if (existingIndex !== -1) {
          newResults[existingIndex] = result;
        } else {
          newResults.push(result);
        }
        return newResults;
      };
      setScanResults(result(scanResults));
    },
    [scanResults, setScanResults]
  );

  const getPorts = useCallback(() => {
    switch (portRange) {
      case "common":
        return Array.from({ length: 1000 }, (_, i) => i + 1);
      case "all":
        return Array.from({ length: 65535 }, (_, i) => i + 1);
      case "custom":
        const ranges = customPortRange.split(",").map((r) => r.split("-").map(Number));
        let ports: number[] = [];
        ranges.forEach(([start, end]) => {
          ports = ports.concat(
            Array.from({ length: end - start + 1 }, (_, i) => i + start)
          );
        });
        return ports;
      default:
        return [];
    }
  }, [portRange, customPortRange]);

  const updateProgress = useCallback(() => {
    const totalPorts = getPorts().length;
    const scannedPorts = scanResults.length;
    setProgress((scannedPorts / totalPorts) * 100);
  }, [getPorts, scanResults.length, setProgress]);

  const startScan = async () => {
    try {
      ipSchema.parse(ipAddress);
      if (portRange === "custom" && !validatePortRange(portRange)) {
        return;
      }

      setIsScanning(true);
      setIsCancelled(false);
      cancelRef.current = false;
      setProgress(0);
      setScanResults([]);
      setStatus("正在扫描...");
      setActiveTab("results");

      const ports = getPorts();
      const chunks = chunkArray(ports, concurrentScans);

      for (const chunk of chunks) {
        if (isCancelled || cancelRef.current) break;

        await Promise.all(
          chunk.map((port) =>
            scanWorker.postMessage({
              port,
              host: ipAddress,
              timeout,
              options: {
                proxy:
                  selectedInterface === "proxy"
                    ? {
                        host: ipAddress,
                        port: 8080,
                      }
                    : undefined,
              },
            })
          )
        );
      }

      finalizeScan();
    } catch (error: unknown) {
      handleScanError(error);
    }
  };

  const finalizeScan = () => {
    if (cancelRef.current) {
      setStatus("扫描已取消");
    } else {
      setStatus("扫描完成");
      saveScanHistory();
    }
    setIsScanning(false);
  };

  const saveScanHistory = () => {
    const newScan: ScanHistory = {
      id: Date.now().toString(),
      date: new Date().toLocaleString(),
      ipAddress,
      openPorts: scanResults.filter((r) => r.status === "open").length,
    };
    setScanHistory([newScan, ...scanHistory]);
    logger.info("Scan history saved", { newScan });
  };

  const exportToCSV = () => {
    try {
      const csvContent =
        "data:text/csv;charset=utf-8," +
        "Port,Status,Service\n" +
        scanResults
          .map((result) => `${result.port},${result.status},${result.service || ""}`)
          .join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute(
        "download",
        `port_scan_${ipAddress}_${new Date().toISOString()}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({
        title: "导出成功",
        description: "扫描结果已成功导出为CSV文件",
      });
      logger.info("Scan results exported to CSV", { ipAddress });
    } catch (error: unknown) {
      console.error("导出CSV失败:", error);
      logger.error("Export to CSV failed", error);
      toast({
        title: "导出失败",
        description:
          error instanceof Error ? error.message : "扫描结果导出过程中发生错误",
        variant: "destructive",
      });
    }
  };

  const handleCancelScan = () => {
    cancelRef.current = true;
    setIsCancelled(true);
    setIsScanning(false);
    setStatus("扫描已取消");
    toast({
      title: "扫描已取消",
      description: "扫描操作已被用户中断",
      variant: "default",
    });
  };

  const handleSpeedChange = (value: ScanSpeed) => {
    setScanSpeed(value);
    setTimeoutValue(
      value === "fast" ? 100 : value === "normal" ? 500 : 2000
    );
  };

  if (!isOpen) return null;

  const modalVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            variants={modalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", duration: 0.5 }}
            className="bg-background dark:bg-gray-900/95 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-xl"
          >
            <div className="flex flex-col h-full">
              <div className="p-6 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-semibold">端口扫描</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="hover:bg-accent"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                <div className="px-6 border-b">
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="scan" className="flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      扫描
                    </TabsTrigger>
                    <TabsTrigger value="results" className="flex items-center gap-2">
                      <List className="w-4 h-4" />
                      结果
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      设置
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <TabsContent value="scan" className="mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">扫描配置</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label>目标地址</Label>
                            <Input
                              placeholder="输入IP地址"
                              value={ipAddress}
                              onChange={(e) => setIpAddress(e.target.value)}
                              disabled={isScanning}
                              className="font-mono"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>端口范围</Label>
                            <RadioGroup
                              value={portRange}
                              onValueChange={(value) => {
                                setPortRange(value);
                                setShowCustomRange(value === "custom");
                              }}
                              className="space-y-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="common" id="common" disabled={isScanning} />
                                <Label htmlFor="common">常用端口 (1-1000)</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="all" id="all" disabled={isScanning} />
                                <Label htmlFor="all">全部端口 (1-65535)</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="custom" id="custom" disabled={isScanning} />
                                <Label htmlFor="custom">自定义范围</Label>
                              </div>
                            </RadioGroup>

                            <AnimatePresence>
                              {showCustomRange && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <Input
                                    placeholder="例如: 80,443,3000-4000"
                                    value={customPortRange}
                                    onChange={(e) => setCustomPortRange(e.target.value)}
                                    disabled={isScanning}
                                    className="mt-2 font-mono"
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>扫描速度</Label>
                              <Badge variant="outline">
                                {timeout}ms 超时
                              </Badge>
                            </div>
                            <Select
                              value={scanSpeed}
                              onValueChange={handleSpeedChange}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="选择扫描速度" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fast">快速 (高负载)</SelectItem>
                                <SelectItem value="normal">正常</SelectItem>
                                <SelectItem value="thorough">彻底 (低负载)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label>并发扫描数</Label>
                              <Badge variant="outline">
                                {concurrentScans} 个端口
                              </Badge>
                            </div>
                            <Slider
                              value={[concurrentScans]}
                              onValueChange={(value) => setConcurrentScans(value[0])}
                              min={1}
                              max={100}
                              step={1}
                              disabled={isScanning}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={showClosedPorts}
                              onCheckedChange={setShowClosedPorts}
                              disabled={isScanning}
                            />
                            <Label>显示关闭的端口</Label>
                          </div>

                          {isScanning ? (
                            <Button
                              variant="destructive"
                              onClick={handleCancelScan}
                              className="min-w-[120px]"
                            >
                              <X className="w-4 h-4 mr-2" />
                              取消扫描
                            </Button>
                          ) : (
                            <Button
                              onClick={startScan}
                              disabled={!ipAddress || isScanning}
                              className="min-w-[120px]"
                            >
                              <Shield className="w-4 h-4 mr-2" />
                              开始扫描
                            </Button>
                          )}
                        </div>

                        {status && (
                          <Alert>
                            <AlertTitle>扫描状态</AlertTitle>
                            <AlertDescription className="flex items-center justify-between">
                              <span>{status}</span>
                              <Progress value={progress} className="w-1/3" />
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="results" className="mt-0">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">扫描结果</CardTitle>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={exportToCSV}
                            disabled={!scanResults.length}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            导出
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setScanResults([])}
                            disabled={!scanResults.length}
                          >
                            <X className="w-4 h-4 mr-2" />
                            清空
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {scanResults.length > 0 ? (
                          <div className="relative overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[100px]">端口</TableHead>
                                  <TableHead className="w-[100px]">状态</TableHead>
                                  <TableHead>服务</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {scanResults
                                  .filter(
                                    (result) => showClosedPorts || result.status === "open"
                                  )
                                  .map((result) => (
                                    <TableRow key={result.port}>
                                      <TableCell className="font-mono">
                                        {result.port}
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          variant={
                                            result.status === "open"
                                              ? "default"
                                              : "secondary"
                                          }
                                          className={
                                            result.status === "open"
                                              ? "bg-green-500/10 text-green-500"
                                              : undefined
                                          }
                                        >
                                          {result.status === "open" ? "开放" : "关闭"}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-muted-foreground">
                                        {result.service || "-"}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            暂无扫描结果
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="settings" className="mt-0">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">扫描历史</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {scanHistory.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>时间</TableHead>
                                <TableHead>IP地址</TableHead>
                                <TableHead>开放端口数</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {scanHistory.map((history) => (
                                <TableRow key={history.id}>
                                  <TableCell>{history.date}</TableCell>
                                  <TableCell className="font-mono">
                                    {history.ipAddress}
                                  </TableCell>
                                  <TableCell>
                                    <Badge>{history.openPorts}</Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            暂无扫描历史
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default React.memo(ServerPortScanModal);
