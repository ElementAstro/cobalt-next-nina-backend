import { motion } from "framer-motion"; // 添加动画支持
import { Badge } from "@/components/ui/badge"; // 添加 Badge 组件
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
} from "lucide-react";
import { Card } from "@/components/ui/card";

interface ProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: DarkFieldProgress;
  currentTemp: number;
}

export function ProgressDialog({
  open,
  onOpenChange,
  progress,
  currentTemp,
}: ProgressDialogProps) {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const isPortrait = useMediaQuery({ query: "(orientation: portrait)" });

  const completionPercentage =
    (progress.currentFrame / progress.totalFrames) * 100;

  // 添加动画配置
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-lg",
          isPortrait && "max-w-[98vw] h-[90vh]",
          "bg-background/95 backdrop-blur-sm",
          "border-none shadow-xl"
        )}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle
            className={cn(
              "text-xl font-semibold flex items-center gap-2",
              isMobile && "text-lg"
            )}
          >
            <motion.div {...fadeIn}>
              <Badge variant="outline" className="bg-primary/10">
                创建进度详情
              </Badge>
            </motion.div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea
          className={cn(
            "mt-4 pr-4",
            isPortrait ? "h-[calc(90vh-8rem)]" : "h-[400px]"
          )}
        >
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
          >
            {/* 进度概览卡片 */}
            <motion.div {...fadeIn}>
              <Card className="p-4 bg-card/50 backdrop-blur border-primary/10 shadow-sm">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3
                      className={cn(
                        "font-medium flex items-center gap-2",
                        isMobile && "text-sm"
                      )}
                    >
                      <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                      当前进度
                    </h3>
                    <Badge
                      variant="secondary"
                      className={cn("font-mono", isMobile && "text-xs")}
                    >
                      {completionPercentage.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress value={completionPercentage} className="h-2" />
                </div>
              </Card>
            </motion.div>

            {/* 详细信息卡片 */}
            <motion.div {...fadeIn}>
              <Card className="p-4 bg-card/50 backdrop-blur border-primary/10 shadow-sm">
                <div
                  className={cn(
                    "grid gap-4",
                    isPortrait ? "grid-cols-1" : "grid-cols-2"
                  )}
                >
                  {[
                    {
                      icon: <Layers className="h-4 w-4 text-blue-400" />,
                      label: "当前阶段",
                      value: progress.stage,
                    },
                    {
                      icon: <Camera className="h-4 w-4 text-green-400" />,
                      label: "拍摄进度",
                      value: `${progress.currentFrame}/${progress.totalFrames} 帧`,
                    },
                    {
                      icon: <Clock className="h-4 w-4 text-yellow-400" />,
                      label: "当前曝光",
                      value: `${progress.currentExposure}s`,
                    },
                    {
                      icon: <Thermometer className="h-4 w-4 text-red-400" />,
                      label: "当前温度",
                      value: `${currentTemp.toFixed(1)}°C`,
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      {item.icon}
                      <div>
                        <p
                          className={cn(
                            "text-sm text-muted-foreground",
                            isMobile && "text-xs"
                          )}
                        >
                          {item.label}
                        </p>
                        <p className={cn("font-medium", isMobile && "text-sm")}>
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 p-2 mt-4 border-t">
                  <Clock className="h-4 w-4 text-purple-400" />
                  <div>
                    <p
                      className={cn(
                        "text-sm text-muted-foreground",
                        isMobile && "text-xs"
                      )}
                    >
                      预计剩余时间
                    </p>
                    <p className={cn("font-medium", isMobile && "text-sm")}>
                      {Math.ceil(progress.estimatedTimeLeft / 60)}分钟
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* 警告信息卡片 */}
            {progress.warnings.length > 0 && (
              <motion.div {...fadeIn}>
                <Card className="p-4 bg-yellow-500/10 border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <Badge
                      variant="outline"
                      className="text-yellow-500 border-yellow-500"
                    >
                      警告信息
                    </Badge>
                  </div>
                  <ul className="space-y-2">
                    {progress.warnings.map((warning, i) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn(
                          "text-yellow-500/90",
                          isMobile ? "text-xs" : "text-sm",
                          "flex items-center gap-2 p-2 rounded-lg bg-yellow-500/5"
                        )}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                        {warning}
                      </motion.li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
