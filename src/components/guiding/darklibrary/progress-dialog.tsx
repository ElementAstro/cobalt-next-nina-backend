"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DarkFieldProgress } from "@/types/guiding/darkfield";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMediaQuery } from "react-responsive";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  Thermometer,
  AlertTriangle,
  Camera,
  Layers,
  Activity,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: DarkFieldProgress;
  currentTemp: number;
}

// 动画变体配置
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

export function ProgressDialog({
  open,
  onOpenChange,
  progress,
  currentTemp,
}: ProgressDialogProps) {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const isPortrait = useMediaQuery({ query: "(orientation: portrait)" });

  const completionPercentage = (progress.currentFrame / progress.totalFrames) * 100;

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "max-w-lg",
            isPortrait && "max-w-[98vw] h-[90vh]",
            "bg-background/95 backdrop-blur-sm",
            "border-none shadow-xl",
            "rounded-xl"
          )}
        >
          <DialogHeader className="space-y-2">
            <DialogTitle className={cn(
              "text-xl font-semibold flex items-center gap-2",
              isMobile && "text-lg"
            )}>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Badge variant="outline" className="bg-primary/10 flex items-center gap-2">
                  <Activity className="w-3 h-3 animate-pulse" />
                  创建进度详情
                </Badge>
              </motion.div>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className={cn(
            "mt-4 pr-4",
            isPortrait ? "h-[calc(90vh-8rem)]" : "h-[400px]"
          )}>
            <motion.div
              className="space-y-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* 进度概览卡片 */}
              <motion.div variants={itemVariants}>
                <Card className="p-4 bg-card/50 backdrop-blur border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className={cn(
                        "font-medium flex items-center gap-2",
                        isMobile && "text-sm"
                      )}>
                        <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping" />
                        当前进度
                      </h3>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "font-mono",
                          isMobile && "text-xs",
                          "bg-primary/10 text-primary"
                        )}
                      >
                        {completionPercentage.toFixed(1)}%
                      </Badge>
                    </div>
                    <div className="relative">
                      <Progress
                        value={completionPercentage}
                        className="h-2"
                      />
                      <motion.div
                        className="absolute top-0 left-0 h-full bg-primary/20"
                        initial={{ width: 0 }}
                        animate={{ width: `${completionPercentage}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* 详细信息卡片 */}
              <motion.div variants={itemVariants}>
                <Card className="p-4 bg-card/50 backdrop-blur border-primary/10 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className={cn(
                    "grid gap-4",
                    isPortrait ? "grid-cols-1" : "grid-cols-2"
                  )}>
                    {[
                      {
                        icon: <Layers className="h-4 w-4 text-blue-400" />,
                        label: "当前阶段",
                        value: progress.stage,
                        tooltip: "当前正在执行的处理阶段",
                      },
                      {
                        icon: <Camera className="h-4 w-4 text-green-400" />,
                        label: "拍摄进度",
                        value: `${progress.currentFrame}/${progress.totalFrames} 帧`,
                        tooltip: "已完成帧数/总帧数",
                      },
                      {
                        icon: <Clock className="h-4 w-4 text-yellow-400" />,
                        label: "当前曝光",
                        value: `${progress.currentExposure}s`,
                        tooltip: "当前正在曝光的时间",
                      },
                      {
                        icon: <Thermometer className="h-4 w-4 text-red-400" />,
                        label: "当前温度",
                        value: `${currentTemp.toFixed(1)}°C`,
                        tooltip: "相机传感器当前温度",
                      },
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-all duration-200"
                        whileHover={{ scale: 1.02 }}
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>{item.icon}</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                        <div>
                          <p className={cn(
                            "text-sm text-muted-foreground",
                            isMobile && "text-xs"
                          )}>
                            {item.label}
                          </p>
                          <p className={cn(
                            "font-medium",
                            isMobile && "text-sm"
                          )}>
                            {item.value}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div
                    variants={itemVariants}
                    className="flex items-center gap-3 p-3 mt-4 border-t"
                  >
                    <Clock className="h-4 w-4 text-purple-400" />
                    <div>
                      <p className={cn(
                        "text-sm text-muted-foreground",
                        isMobile && "text-xs"
                      )}>
                        预计剩余时间
                      </p>
                      <p className={cn(
                        "font-medium",
                        isMobile && "text-sm"
                      )}>
                        {Math.ceil(progress.estimatedTimeLeft / 60)}分钟
                      </p>
                    </div>
                  </motion.div>
                </Card>
              </motion.div>

              {/* 警告信息卡片 */}
              {progress.warnings.length > 0 && (
                <motion.div variants={itemVariants}>
                  <Card className="p-4 bg-yellow-500/10 backdrop-blur border-yellow-500/20 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 animate-pulse" />
                      <Badge
                        variant="outline"
                        className="text-yellow-500 border-yellow-500"
                      >
                        警告信息
                      </Badge>
                    </div>
                    <motion.ul
                      className="space-y-2"
                      variants={containerVariants}
                    >
                      {progress.warnings.map((warning, i) => (
                        <motion.li
                          key={i}
                          variants={itemVariants}
                          className={cn(
                            "text-yellow-500/90",
                            isMobile ? "text-xs" : "text-sm",
                            "flex items-center gap-2 p-2 rounded-lg",
                            "bg-yellow-500/5 hover:bg-yellow-500/10",
                            "transition-all duration-200"
                          )}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                          {warning}
                        </motion.li>
                      ))}
                    </motion.ul>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
