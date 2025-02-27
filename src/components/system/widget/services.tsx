// components/widgets/ServicesWidget.jsx
"use client";

import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Server, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedCard from "../animated-card";
import useSystemStore from "@/stores/system/systemStore";

type ServiceAction = "start" | "stop" | "restart";

export default function ServicesWidget() {
  const { systemInfo } = useSystemStore();

  // 模拟服务操作
  const handleServiceAction = (serviceName: string, action: ServiceAction) => {
    // 在实际应用中，这里应该调用API来启动/停止服务
    console.log(`Service ${serviceName} ${action} requested`);
  };

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
          {systemInfo.services.list.map((service, index) => {
            const isRunning = service.status === "running";

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-md bg-muted/50"
              >
                <div className="flex items-start gap-2">
                  {isRunning ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  )}
                  <div>
                    <div className="font-medium">{service.name}</div>
                    <div
                      className={`text-xs ${
                        isRunning
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {isRunning ? "运行中" : "已停止"}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {isRunning ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                      onClick={() => handleServiceAction(service.name, "stop")}
                    >
                      停止
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
                      onClick={() => handleServiceAction(service.name, "start")}
                    >
                      启动
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleServiceAction(service.name, "restart")}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </AnimatedCard>
  );
}
