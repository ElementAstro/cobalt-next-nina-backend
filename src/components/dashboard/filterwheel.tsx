"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Power,
  CheckCircle2,
  AlertCircle,
  Filter,
  Settings2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useFilterWheelStore } from "@/stores/filterwheelStore";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export function FilterWheelPage() {
  const filterWheel = useFilterWheelStore();
  const [showAdvancedDialog, setShowAdvancedDialog] = useState(false);

  useEffect(() => {
    // 初始加载时获取滤镜轮信息
    filterWheel.getFilterWheelInfo();
  }, [filterWheel]);

  const handleConnect = async () => {
    try {
      await filterWheel.connect();
      toast.success("连接成功", {
        description: "已成功连接到滤镜轮",
      });
    } catch (error: unknown) {
      let message = "无法连接到滤镜轮";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error("连接失败", {
        description: message,
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await filterWheel.disconnect();
      toast.success("断开连接成功", {
        description: "已成功断开与滤镜轮的连接",
      });
    } catch (error: unknown) {
      let message = "无法断开与滤镜轮的连接";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error("断开连接失败", {
        description: message,
      });
    }
  };

  const handleChangeFilter = async (filterId: number) => {
    try {
      await filterWheel.changeFilter(filterId);
      toast.success("滤镜切换成功", {
        description: `已切换到滤镜 ${filterId}`,
      });
    } catch (error: unknown) {
      let message = "无法切换滤镜";
      if (error instanceof Error) {
        message = error.message;
      }
      toast.error("滤镜切换失败", {
        description: message,
      });
    }
  };

  return (
    <motion.div
      className="container mx-auto p-4 h-full flex flex-col gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">滤镜轮控制</h2>
        <Button
          variant={filterWheel.isConnected ? "destructive" : "default"}
          onClick={filterWheel.isConnected ? handleDisconnect : handleConnect}
          disabled={filterWheel.isLoading}
        >
          {filterWheel.isConnected ? "断开连接" : "连接"}
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {/* Filter Wheel Status Panel */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-6 w-6 animate-pulse" />
              滤镜轮状态
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Power className="w-4 h-4" />
                  连接状态
                </Label>
                <Badge
                  variant={filterWheel.isConnected ? "default" : "destructive"}
                  className="flex items-center gap-1"
                >
                  {filterWheel.isConnected ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  {filterWheel.isConnected ? "已连接" : "未连接"}
                </Badge>
              </div>
            </div>

            <Separator />

            {filterWheel.filterWheelInfo && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>当前滤镜</Label>
                  <Label className="font-mono">
                    {filterWheel.filterWheelInfo.SelectedFilter?.Name || "无"}
                  </Label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filter Wheel Control Panel */}
        <Card className="w-full">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-6 w-6" />
                滤镜轮控制
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filterWheel.filterWheelInfo &&
                  filterWheel.filterWheelInfo.AvailableFilters &&
                  filterWheel.filterWheelInfo.AvailableFilters.length > 0 && (
                    <div className="space-y-2">
                      <Label>选择滤镜</Label>
                      <Select
                        onValueChange={(value) =>
                          handleChangeFilter(parseInt(value))
                        }
                        disabled={!filterWheel.isConnected}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择滤镜" />
                        </SelectTrigger>
                        <SelectContent>
                          {filterWheel.filterWheelInfo.AvailableFilters.map(
                            (filter) => (
                              <SelectItem
                                key={filter.Id}
                                value={filter.Id.toString()}
                              >
                                {filter.Name}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                <Button
                  variant="outline"
                  onClick={() => setShowAdvancedDialog(true)}
                >
                  高级设置
                </Button>

                <AlertDialog
                  open={showAdvancedDialog}
                  onOpenChange={setShowAdvancedDialog}
                >
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>高级滤镜轮设置</AlertDialogTitle>
                      <AlertDialogDescription>
                        请谨慎调整以下参数，不当的设置可能会影响图像质量。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="grid gap-4 py-4">
                      <Label htmlFor="name">滤镜名称</Label>
                      <Input
                        id="name"
                        defaultValue=" "
                        className="col-span-3"
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction>保存设置</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </motion.div>
        </Card>
      </div>
    </motion.div>
  );
}
