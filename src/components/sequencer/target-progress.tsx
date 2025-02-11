"use client";

import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useSequencerStore } from "@/stores/sequencer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";

export function TargetProgress() {
  const { targets, activeTargetId, taskStatuses } = useSequencerStore();

  const activeTarget = targets.find((t) => t.id === activeTargetId);

  if (!activeTarget) return null;

  const totalTasks = activeTarget.tasks.length;
  const completedTasks = activeTarget.tasks.filter(
    (task) => taskStatuses[task.id]?.status === "completed"
  ).length;
  const failedTasks = activeTarget.tasks.filter(
    (task) => taskStatuses[task.id]?.status === "failed"
  ).length;

  const progress = (completedTasks / totalTasks) * 100;

  return (
    <motion.div
      className="bg-gray-900/50 p-2 rounded-lg"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-col space-y-2">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            <h3 className="text-sm font-medium">目标进度</h3>
            <div className="text-xs text-gray-400">
              已完成 {completedTasks} / {totalTasks} 个任务
            </div>
          </div>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex space-x-1">
                  <Badge
                    variant="outline"
                    className="h-6 bg-green-500/10 hover:bg-green-500/20"
                  >
                    {completedTasks}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="h-6 bg-red-500/10 hover:bg-red-500/20"
                  >
                    {failedTasks}
                  </Badge>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>完成: {completedTasks}</p>
                <p>失败: {failedTasks}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Progress */}
        <div className="space-y-1">
          <Progress value={progress} className="h-1" />
          <div className="flex justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>预计剩余时间: 2小时30分钟</span>
            </div>
            <div className="flex items-center gap-2">
              {failedTasks > 0 && (
                <div className="flex items-center gap-1 text-red-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{failedTasks} 个失败</span>
                </div>
              )}
              {progress === 100 && (
                <div className="flex items-center gap-1 text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  <span>完成</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
