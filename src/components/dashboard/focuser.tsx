"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Power,
  Compass,
  StopCircle,
  Settings2,
  Target,
  Settings,
  History,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useFocuserStore } from "@/stores/focuserStore";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import focuserApi from "@/services/api/focuser";
import { toast } from "sonner";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function FocuserPage() {
  const [inputPosition, setInputPosition] = useState("12500");
  const [isLoading, setIsLoading] = useState(false);
  const {
    focuserInfo,
    isConnected,
    move,
    halt,
    setTempComp,
    moveHistory,
    clearMoveHistory,
  } = useFocuserStore();

  useEffect(() => {
    // 初始加载时获取聚焦器信息
  }, []);

  const handleError = (error: unknown) => {
    let message = "未知错误";
    if (error instanceof Error) {
      message = error.message;
    }
    toast.error("操作失败", {
      description: message,
    });
  };

  const handleMove = async (steps: number) => {
    try {
      setIsLoading(true);
      await move(steps);
      toast.info(`正在移动 ${steps} 步`, {
        description: `移动 ${steps} 步`,
      });
    } catch (error: unknown) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoveToPosition = async () => {
    const position = parseInt(inputPosition);
    try {
      setIsLoading(true);
      await move(position);
      toast.info(`正在移动到位置 ${position}`, {
        description: `移动到位置 ${position}`,
      });
    } catch (error: unknown) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemperatureCompensation = async (enabled: boolean) => {
    try {
      setIsLoading(true);
      await setTempComp(enabled);
      toast.info(`温度补偿已${enabled ? "启用" : "禁用"}`, {
        description: `温度补偿已${enabled ? "启用" : "禁用"}`,
      });
    } catch (error: unknown) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      await focuserApi.connect();
      toast.success("已成功连接到聚焦器", {
        description: "连接成功",
      });
    } catch (error: unknown) {
      let message = "无法连接到聚焦器";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message, {
        description: "连接失败",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await focuserApi.disconnect();
      toast.success("已成功断开与聚焦器的连接", {
        description: "断开连接成功",
      });
    } catch (error: unknown) {
      let message = "无法断开与聚焦器的连接";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message, {
        description: "断开连接失败",
      });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="container mx-auto h-[calc(100vh-4rem)] flex flex-col"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
      >
        <div className="flex-none p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">相机控制</h2>
            <Button
              variant={isConnected ? "destructive" : "default"}
              onClick={isConnected ? handleDisconnect : handleConnect}
              disabled={isLoading}
            >
              {isConnected ? "断开连接" : "连接"}
            </Button>
          </div>
          {isConnected && (
            <Badge
              variant={focuserInfo?.IsMoving ? "outline" : "secondary"}
              className="ml-2"
            >
              {focuserInfo?.IsMoving ? (
                <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Target className="mr-1 h-3 w-3" />
              )}
              {focuserInfo?.IsMoving ? "移动中" : "就绪"}
            </Badge>
          )}
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-1 gap-6">
            <Card className="bg-background/95 supports-[backdrop-filter]:bg-background/60 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Compass className="h-6 w-6" />
                    Focuser 状态
                  </div>
                  <Badge variant={isConnected ? "default" : "destructive"}>
                    <Power className="mr-1 h-3 w-3" />
                    {isConnected ? "已连接" : "未连接"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div
                  variants={containerVariants}
                  className="grid grid-cols-1 gap-4"
                >
                  {/* 核心状态 */}
                  <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-between"
                  >
                    <Label>目标位置</Label>
                    <div className="text-sm font-medium">
                      {focuserInfo?.Position} 步{" "}
                      {focuserInfo?.IsMoving && "(移动中...)"}
                    </div>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-between"
                  >
                    <Label>当前位置</Label>
                    <div className="text-sm font-medium">
                      {focuserInfo?.Position} 步
                    </div>
                  </motion.div>

                  <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-between"
                  >
                    <Label>当前温度</Label>
                    <div className="text-sm font-medium">
                      {focuserInfo?.Temperature}°C
                    </div>
                  </motion.div>

                  {/* 补偿设置 */}
                  <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-between"
                  >
                    <Label>温度补偿</Label>
                    <Switch
                      id="temp-comp-switch"
                      checked={focuserInfo?.TempComp}
                      onCheckedChange={handleTemperatureCompensation}
                      disabled={!isConnected}
                    />
                    <Label className="text-sm">
                      {focuserInfo?.TempComp ? "已启用" : "已禁用"}
                    </Label>
                  </motion.div>

                  {/* 位置限制 */}
                  <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-between"
                  >
                    <Label>最大/当前步数</Label>
                    <div className="text-sm font-medium">
                      {focuserInfo?.MaxStep} / {focuserInfo?.StepSize} 步
                    </div>
                  </motion.div>

                  {/* 移动历史 */}
                  <motion.div variants={itemVariants}>
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="flex items-center gap-2 w-full justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <History className="h-4 w-4" />
                            <Label>最近移动历史</Label>
                          </div>
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <ScrollArea className="h-24 w-full rounded-md border mt-2">
                          <div className="p-4">
                            {moveHistory.length === 0 ? (
                              <div className="text-sm text-muted-foreground">
                                暂无移动记录
                              </div>
                            ) : (
                              moveHistory.map((position, index) => (
                                <div
                                  key={index}
                                  className="text-sm flex items-center gap-2 py-1"
                                >
                                  <ArrowUpDown className="h-3 w-3" />
                                  <span>移动到 {position} 步</span>
                                </div>
                              ))
                            )}
                          </div>
                        </ScrollArea>
                      </CollapsibleContent>
                    </Collapsible>
                  </motion.div>
                </motion.div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="bg-background/95 supports-[backdrop-filter]:bg-background/60 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-6 w-6" />
                    Focuser 控制
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="control" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="control">控制</TabsTrigger>
                      <TabsTrigger value="settings">设置</TabsTrigger>
                      <TabsTrigger value="history">历史</TabsTrigger>
                      <TabsTrigger value="advanced">高级</TabsTrigger>
                    </TabsList>

                    <TabsContent value="control">
                      <div className="space-y-4">
                        <motion.div
                          variants={itemVariants}
                          className="flex flex-col space-y-4"
                        >
                          <Label htmlFor="target-position">目标位置</Label>
                          <div className="flex space-x-4">
                            <Input
                              id="target-position"
                              type="number"
                              value={inputPosition}
                              onChange={(e) => setInputPosition(e.target.value)}
                              className="flex-1"
                              disabled={!isConnected}
                            />
                            <Button
                              onClick={handleMoveToPosition}
                              className="whitespace-nowrap"
                              disabled={!isConnected || isLoading}
                            >
                              移动到
                            </Button>
                          </div>
                        </motion.div>

                        <motion.div
                          variants={itemVariants}
                          className="flex justify-center gap-4"
                        >
                          <Button
                            variant="secondary"
                            onClick={() => handleMove(-1000)}
                            className="min-w-[48px] h-[48px] sm:min-w-[64px] sm:h-[48px]"
                            disabled={!isConnected || isLoading}
                            aria-label="向左移动1000步"
                          >
                            <ChevronFirst className="h-6 w-6" />
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => handleMove(-100)}
                            className="min-w-[48px] h-[48px] sm:min-w-[64px] sm:h-[48px]"
                            disabled={!isConnected || isLoading}
                            aria-label="向左移动100步"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => handleMove(100)}
                            className="min-w-[48px] h-[48px] sm:min-w-[64px] sm:h-[48px]"
                            disabled={!isConnected || isLoading}
                            aria-label="向右移动100步"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => handleMove(1000)}
                            className="min-w-[48px] h-[48px] sm:min-w-[64px] sm:h-[48px]"
                            disabled={!isConnected || isLoading}
                            aria-label="向右移动1000步"
                          >
                            <ChevronLast className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </div>
                    </TabsContent>

                    <TabsContent value="settings">
                      <div className="space-y-4">
                        <motion.div
                          variants={itemVariants}
                          className="flex items-center justify-between"
                        >
                          <Label htmlFor="temp-comp-switch">温度补偿</Label>
                          <Switch
                            id="temp-comp-switch"
                            checked={focuserInfo?.TempComp}
                            onCheckedChange={handleTemperatureCompensation}
                            disabled={!isConnected}
                          />
                        </motion.div>
                      </div>
                    </TabsContent>

                    <TabsContent value="history">
                      <div className="space-y-4">
                        <motion.div
                          variants={itemVariants}
                          className="space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <Label>移动历史记录</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={clearMoveHistory}
                            >
                              清除历史
                            </Button>
                          </div>
                          <ScrollArea className="h-48 rounded-md border">
                            <div className="p-4">
                              {moveHistory.length === 0 ? (
                                <div className="text-sm text-muted-foreground">
                                  暂无移动记录
                                </div>
                              ) : (
                                moveHistory.map((position, index) => (
                                  <div
                                    key={index}
                                    className="text-sm flex items-center gap-2 py-1"
                                  >
                                    <ArrowUpDown className="h-3 w-3" />
                                    <span>移动到 {position} 步</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </ScrollArea>
                        </motion.div>
                      </div>
                    </TabsContent>

                    <TabsContent value="advanced">
                      <div className="space-y-4">
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              className="w-full justify-between"
                            >
                              <Label>高级设置</Label>
                              <Settings className="h-4 w-4" />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="space-y-2"></CollapsibleContent>
                        </Collapsible>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {focuserInfo?.IsMoving && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4"
          >
            <Button
              variant="destructive"
              onClick={() => halt()}
              className="flex items-center gap-2"
              disabled={!isLoading}
            >
              <StopCircle className="h-4 w-4" />
              停止移动
            </Button>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
