"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertTriangle,
  Clock,
  Pause,
  Play,
  RefreshCw,
  Star,
  Timer,
  Target,
  Waves,
} from "lucide-react";
import { useSequencerStore } from "@/stores/sequencer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import type { Target as TargetType, ExposureTask } from "@/stores/sequencer";

interface TaskProgressProps {
  completed: number;
  total: number;
  type: ExposureTask["type"];
  status: ExposureTask["status"];
}

const TaskProgress = ({ completed, total, type, status }: TaskProgressProps) => {
  const getTypeIcon = () => {
    switch (type) {
      case "light":
        return <Star className="w-4 h-4 text-yellow-400" />;
      case "dark":
        return <Target className="w-4 h-4 text-blue-400" />;
      case "flat":
        return <Waves className="w-4 h-4 text-green-400" />;
      default:
        return <Timer className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-400 border-green-500/50";
      case "running":
        return "bg-blue-500/10 text-blue-400 border-blue-500/50";
      case "failed":
        return "bg-red-500/10 text-red-400 border-red-500/50";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/50";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-4 p-3 bg-gray-800/30 rounded-lg"
    >
      <div className="flex items-center gap-2">
        {getTypeIcon()}
        <Badge variant="outline" className={getStatusColor()}>
          {status}
        </Badge>
      </div>
      <div className="flex-1">
        <Progress value={(completed / total) * 100} className="h-2" />
      </div>
      <div className="text-sm text-gray-400 tabular-nums">
        {completed}/{total}
      </div>
    </motion.div>
  );
};

export function TargetProgress() {
  const { targets, activeTargetId, startTask, pauseTask } = useSequencerStore();

  const activeTarget = targets.find((t: TargetType) => t.id === activeTargetId);

  const handleTaskAction = useCallback(
    (taskId: string, status: ExposureTask["status"]) => {
      if (status === "running") {
        pauseTask(taskId);
      } else {
        startTask(taskId);
      }
    },
    [startTask, pauseTask]
  );

  if (!activeTarget) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              目标进度
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-8 text-gray-400">
            <AlertTriangle className="w-12 h-12 mb-4 opacity-50" />
            <p>请先选择一个目标</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const hasRunningTasks = activeTarget.tasks.some(
    (task: ExposureTask) => task.status === "running"
  );

  const totalProgress = activeTarget.tasks.reduce(
    (acc: { completed: number; total: number }, task: ExposureTask) => {
      acc.completed += task.progress[0];
      acc.total += task.progress[1];
      return acc;
    },
    { completed: 0, total: 0 }
  );

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTarget.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-500" />
                <CardTitle className="text-xl">目标进度</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {activeTarget.tasks.length} 个任务
                </Badge>
              </div>
              {activeTarget.tasks.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleTaskAction(
                            activeTarget.tasks[0].id,
                            hasRunningTasks ? "running" : "pending"
                          )
                        }
                        className="h-8"
                      >
                        {hasRunningTasks ? (
                          <>
                            <Pause className="w-4 h-4 mr-2" />
                            暂停所有
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            开始执行
                          </>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {hasRunningTasks ? "暂停所有任务" : "开始执行所有任务"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <motion.div
                className="p-4 border border-gray-800 rounded-lg bg-gray-800/30"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">总进度</span>
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{
                        rotate: hasRunningTasks ? 360 : 0,
                      }}
                      transition={{
                        duration: 2,
                        repeat: hasRunningTasks ? Infinity : 0,
                        ease: "linear",
                      }}
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${
                          hasRunningTasks
                            ? "text-teal-500"
                            : "text-gray-500"
                        }`}
                      />
                    </motion.div>
                    <span className="text-sm text-gray-400 tabular-nums">
                      {((totalProgress.completed / totalProgress.total) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Progress
                  value={(totalProgress.completed / totalProgress.total) * 100}
                  className="h-2"
                />
              </motion.div>

              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {activeTarget.tasks.map((task: ExposureTask, index: number) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <TaskProgress
                        completed={task.progress[0]}
                        total={task.progress[1]}
                        type={task.type}
                        status={task.status}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {activeTarget.tasks.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center p-8 text-gray-400"
                  >
                    <AlertTriangle className="w-12 h-12 mb-4 opacity-50" />
                    <p>当前目标没有任务</p>
                  </motion.div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
