"use client";

import { DarkFieldProgress } from "@/types/guiding/darkfield";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Thermometer, Activity, AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Stage =
  | "preparing"
  | "capturing"
  | "processing"
  | "saving"
  | "error"
  | "completed"
  | "cancelled"
  | "paused";

interface StatusBarProps {
  isLoading: boolean;
  progress: DarkFieldProgress;
  stage: Stage;
  warnings: string[];
  temperature: number;
  targetTemperature: number;
  coolingEnabled: boolean;
}

const stageConfig: Record<Stage, {
  text: string;
  color: string;
  icon: JSX.Element;
  description: string;
}> = {
  preparing: {
    text: "准备中",
    color: "bg-blue-500",
    icon: <Activity className="h-4 w-4 text-blue-500" />,
    description: "正在初始化相机和设备",
  },
  capturing: {
    text: "拍摄中",
    color: "bg-green-500",
    icon: <Activity className="h-4 w-4 text-green-500" />,
    description: "正在采集暗场图像",
  },
  processing: {
    text: "处理中",
    color: "bg-yellow-500",
    icon: <Activity className="h-4 w-4 text-yellow-500" />,
    description: "正在处理暗场数据",
  },
  saving: {
    text: "保存中",
    color: "bg-purple-500",
    icon: <Activity className="h-4 w-4 text-purple-500" />,
    description: "正在保存暗场库",
  },
  error: {
    text: "错误",
    color: "bg-red-500",
    icon: <AlertCircle className="h-4 w-4 text-red-500" />,
    description: "处理过程中发生错误",
  },
  completed: {
    text: "完成",
    color: "bg-emerald-500",
    icon: <Activity className="h-4 w-4 text-emerald-500" />,
    description: "暗场库创建完成",
  },
  cancelled: {
    text: "已取消",
    color: "bg-gray-500",
    icon: <Activity className="h-4 w-4 text-gray-500" />,
    description: "操作已被取消",
  },
  paused: {
    text: "已暂停",
    color: "bg-orange-500",
    icon: <Activity className="h-4 w-4 text-orange-500" />,
    description: "处理已暂停",
  },
};

const progressVariants = {
  initial: { scaleX: 0, opacity: 0 },
  animate: {
    scaleX: 1,
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: "easeInOut",
    },
  },
};

const temperatureVariants = {
  stable: { scale: 1 },
  unstable: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
    },
  },
};

export function StatusBar({
  isLoading,
  progress,
  stage,
  temperature,
  targetTemperature,
  coolingEnabled,
}: StatusBarProps) {
  if (!isLoading) return null;

  const completionPercentage = (progress.currentFrame / progress.totalFrames) * 100;
  const isTemperatureStable = Math.abs(temperature - targetTemperature) < 0.5;
  const currentStage = stageConfig[stage];

  return (
    <TooltipProvider>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="bg-background/95 backdrop-blur-md border-b shadow-lg">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <motion.div
                className="flex items-center gap-4"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize flex items-center gap-2 transition-colors duration-300",
                        currentStage.color.replace("bg-", "border-"),
                        currentStage.color.replace("bg-", "text-")
                      )}
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [1, 0.8, 1],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        {currentStage.icon}
                      </motion.div>
                      {currentStage.text}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{currentStage.description}</p>
                  </TooltipContent>
                </Tooltip>

                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    进度: {progress.currentFrame} / {progress.totalFrames}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(completionPercentage)}%
                  </span>
                </div>
              </motion.div>

              <AnimatePresence>
                {coolingEnabled && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-3"
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2">
                          <motion.div
                            variants={temperatureVariants}
                            animate={isTemperatureStable ? "stable" : "unstable"}
                          >
                            <Thermometer className="h-4 w-4 text-red-400" />
                          </motion.div>
                          <span className="text-sm">
                            {temperature.toFixed(1)}°C / {targetTemperature}°C
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>当前温度/目标温度</p>
                      </TooltipContent>
                    </Tooltip>

                    {isTemperatureStable && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        <Badge
                          variant="outline"
                          className="bg-green-500/10 text-green-500 border-green-500/30"
                        >
                          <motion.div
                            className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5"
                            animate={{
                              opacity: [1, 0.5, 1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                          温度已稳定
                        </Badge>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.div
              className="relative h-1 mt-3 bg-muted rounded-full overflow-hidden"
              initial="initial"
              animate="animate"
            >
              <motion.div
                className={cn(
                  "absolute h-full rounded-full",
                  currentStage.color,
                  "opacity-80"
                )}
                style={{ width: `${completionPercentage}%` }}
                variants={progressVariants}
                transition={{
                  duration: 0.5,
                }}
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{
                    x: ["100%", "-100%"],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
