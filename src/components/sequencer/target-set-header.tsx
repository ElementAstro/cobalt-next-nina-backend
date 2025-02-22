"use client";

import { useCallback } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  Clock,
  Loader2,
  MoreVertical,
  RefreshCw,
  Save,
  Settings,
  Star,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSequencerStore } from "@/stores/sequencer";
import { type Target } from "@/stores/sequencer";
import { toast } from "@/hooks/use-toast";

export function TargetSetHeader() {
  const {
    targets,
    activeTargetId,
    validateTarget,
    isRunning,
    startSequence,
    pauseSequence,
  } = useSequencerStore();

  const activeTarget = targets.find((t: Target) => t.id === activeTargetId);

  const handleValidate = useCallback(async () => {
    if (!activeTarget) return;

    try {
      const result = await validateTarget(activeTarget.id);
      toast({
        title: "验证完成",
        description: result.status === "success" ? "目标配置有效" : "发现潜在问题",
        variant: result.status === "success" ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "验证失败",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }, [activeTarget, validateTarget]);

  const getCompletionPercentage = () => {
    if (!activeTarget) return 0;
    const completedTasks = activeTarget.tasks.filter(
      (task) => task.status === "completed"
    ).length;
    return (completedTasks / activeTarget.tasks.length) * 100;
  };

  if (!activeTarget) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 bg-gray-900/50 backdrop-blur-sm border-b border-gray-800"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-gray-400" />
          <span className="text-gray-400">请选择一个目标</span>
        </div>
      </motion.div>
    );
  }

  const isActive = activeTarget.tasks.some((task) => task.status === "running");

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 bg-gray-900/50 backdrop-blur-sm border-b border-gray-800"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">{activeTarget.name}</h2>
          <Badge variant="secondary" className="text-xs">
            {activeTarget.category}
          </Badge>
        </div>
        <div className="text-sm text-gray-400">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {activeTarget.tasks.length} 个任务
          </span>
        </div>
        <div className="h-8 w-px bg-gray-800" />
        <div className="flex items-center gap-2">
          <div className="w-32">
            <Progress value={getCompletionPercentage()} className="h-2" />
          </div>
          <span className="text-sm text-gray-400">
            {Math.round(getCompletionPercentage())}%
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full"
          >
            <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />
            <span className="text-sm text-teal-500">运行中</span>
          </motion.div>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={isRunning ? pauseSequence : startSequence}
                className="h-8"
              >
                {isRunning ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="mr-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </motion.div>
                    暂停执行
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 mr-2" />
                    开始执行
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isRunning ? "暂停执行" : "开始执行"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>目标操作</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleValidate}>
              <RefreshCw className="w-4 h-4 mr-2" />
              验证目标
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Save className="w-4 h-4 mr-2" />
              保存配置
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              更多设置
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
