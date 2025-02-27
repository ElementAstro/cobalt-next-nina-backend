"use client";

import { useState } from "react";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Server, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedCard from "../animated-card";
import useSystemStore from "@/stores/system/systemStore";
import { successToast, errorToast } from "@/lib/toast";
import { LoadingState } from "../loading-state";
import { ErrorState } from "../error-state";

type ServiceAction = "start" | "stop" | "restart";

export default function ServicesWidget() {
  const { systemInfo, isLoading, error, refreshSystemInfo } = useSystemStore();
  const [pendingService, setPendingService] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<ServiceAction | null>(
    null
  );

  // 服务操作
  const handleServiceAction = async (
    serviceName: string,
    action: ServiceAction
  ) => {
    try {
      // 设置正在操作的服务
      setPendingService(serviceName);
      setPendingAction(action);

      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 根据操作类型显示不同消息
      const actionMessage =
        action === "start" ? "启动" : action === "stop" ? "停止" : "重启";

      // 操作成功
      successToast(`服务 ${serviceName} ${actionMessage}成功`);

      // 刷新系统信息
      refreshSystemInfo();
    } catch (err) {
      errorToast(`服务操作失败: ${(err as Error).message || "未知错误"}`);
    } finally {
      // 清除正在操作的状态
      setPendingService(null);
      setPendingAction(null);
    }
  };

  if (isLoading) {
    return (
      <AnimatedCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            <span>服务</span>
          </CardTitle>
          <CardDescription>加载服务信息...</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px] flex items-center justify-center">
          <LoadingState message="正在获取服务列表..." />
        </CardContent>
      </AnimatedCard>
    );
  }

  if (error) {
    return (
      <AnimatedCard>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            <span>服务</span>
          </CardTitle>
          <CardDescription>加载出错</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px] flex items-center justify-center">
          <ErrorState
            message="无法加载服务列表"
            retryAction={refreshSystemInfo}
          />
        </CardContent>
      </AnimatedCard>
    );
  }

  return (
    <AnimatedCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="h-5 w-5" />
          <span>服务</span>
        </CardTitle>
        <CardDescription>
          运行中:{" "}
          {
            systemInfo.services.list.filter((s) => s.status === "running")
              .length
          }
          /{systemInfo.services.list.length}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AnimatePresence>
            {systemInfo.services.list.map((service, index) => {
              const isRunning = service.status === "running";
              const isPending = service.name === pendingService;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center justify-between p-3 rounded-md bg-muted/50 ${
                    isPending ? "border border-primary/30" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {isPending ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      >
                        <RefreshCw className="h-5 w-5 text-primary mt-0.5" />
                      </motion.div>
                    ) : isRunning ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    )}
                    <div>
                      <div className="font-medium">{service.name}</div>
                      <div
                        className={`text-xs ${
                          isPending
                            ? "text-primary"
                            : isRunning
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {isPending
                          ? pendingAction === "start"
                            ? "正在启动..."
                            : pendingAction === "stop"
                            ? "正在停止..."
                            : "正在重启..."
                          : isRunning
                          ? "运行中"
                          : "已停止"}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isRunning ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() =>
                          handleServiceAction(service.name, "stop")
                        }
                        disabled={isPending}
                      >
                        {isPending && pendingAction === "stop" ? (
                          <LoadingState size="sm" center={false} message="" />
                        ) : (
                          "停止"
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
                        onClick={() =>
                          handleServiceAction(service.name, "start")
                        }
                        disabled={isPending}
                      >
                        {isPending && pendingAction === "start" ? (
                          <LoadingState size="sm" center={false} message="" />
                        ) : (
                          "启动"
                        )}
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        handleServiceAction(service.name, "restart")
                      }
                      disabled={isPending}
                    >
                      {isPending && pendingAction === "restart" ? (
                        <LoadingState size="sm" center={false} message="" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {systemInfo.services.list.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-8 text-center text-muted-foreground"
            >
              没有找到服务
            </motion.div>
          )}
        </div>
      </CardContent>
    </AnimatedCard>
  );
}
