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
  Loader2,
} from "lucide-react";
import { useSequencerStore } from "@/stores/sequencer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { StatusPill } from "./status-pill";
import { SequenceStateBadge } from "./sequence-state-badge";
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

  const progressPercentage = (completed / total) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="flex items-center gap-4 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/40 transition-colors"
      whileHover={{ 
        boxShadow: "0 0 10px rgba(20, 184, 166, 0.1)",
        y: -2
      }}
    >
      <div className="flex items-center gap-2">
        <motion.div
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.6 }}
        >
          {getTypeIcon()}
        </motion.div>
        <StatusPill 
          label={status}
          variant={status === "completed" ? "success" : 
                  status === "running" ? "info" : 
                  status === "failed" ? "error" : "default"}
          pulseIcon={status === "running"}
          icon={status === "running" ? Loader2 : undefined}
          animate={true}
          size="sm"
        />
      </div>
      <div className="flex-1">
        <div className="relative">
          <Progress value={progressPercentage} className="h-2" />
          {status === "running" && progressPercentage > 0 && progressPercentage < 100 && (
            <motion.div
              className="absolute top-0 bottom-0 bg-white/30 w-1"
              style={{ left: `${progressPercentage}%` }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </div>
      </div>
      <motion.div 
        className="text-sm text-gray-400 tabular-nums"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        {completed}/{total}
      </motion.div>
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
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 hover:border-gray-700 transition-colors shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              目标进度
              <SequenceStateBadge state="idle" size="sm" />
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-8 text-gray-400">
            <motion.div
              animate={{ 
                y: [0, -8, 0],
                opacity: [0.5, 0.8, 0.5] 
              }}
              transition={{ 
                duration: 2.5, 
                repeat: Infinity,
                repeatType: "reverse" 
              }}
            >
              <AlertTriangle className="w-12 h-12 mb-4 opacity-50" />
            </motion.div>
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

  const totalPercentage = totalProgress.total > 0 
    ? (totalProgress.completed / totalProgress.total) * 100
    : 0;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTarget.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 hover:border-gray-700 transition-colors shadow-lg">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  whileHover={{ rotate: 15 }}
                  transition={{ type: "spring", stiffness: 300, damping: 10 }}
                >
                  <Clock className="w-5 h-5 text-teal-500" />
                </motion.div>
                <CardTitle className="text-xl">目标进度</CardTitle>
                <SequenceStateBadge 
                  state={hasRunningTasks ? "running" : 
                         activeTarget.tasks.every(t => t.status === "completed") ? "completed" :
                         activeTarget.tasks.some(t => t.status === "failed") ? "failed" : "idle"}
                  size="md"
                  animate={true}
                />
                <Badge variant="secondary" className="text-xs">
                  {activeTarget.tasks.length} 个任务
                </Badge>
              </div>
              {activeTarget.tasks.length > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleTaskAction(
                              activeTarget.tasks[0].id,
                              hasRunningTasks ? "running" : "pending"
                            )
                          }
                          className={`h-8 transition-all ${
                            hasRunningTasks 
                              ? "bg-amber-600/10 text-amber-400 border-amber-500/50 hover:bg-amber-600/20" 
                              : "bg-teal-600/10 text-teal-400 border-teal-500/50 hover:bg-teal-600/20"
                          }`}
                        >
                          {hasRunningTasks ? (
                            <>
                              <Pause className="w-4 h-4 mr-2" />
                              暂停所有
                            </>
                          ) : (
                            <>
                              <motion.div
                                animate={{
                                  x: [0, 2, 0],
                                }}
                                transition={{
                                  duration: 1,
                                  repeat: Infinity,
                                  repeatType: "mirror",
                                }}
                                className="mr-2"
                              >
                                <Play className="w-4 h-4" />
                              </motion.div>
                              开始执行
                            </>
                          )}
                        </Button>
                      </motion.div>
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
                className="p-4 border border-gray-800 rounded-lg bg-gradient-to-b from-gray-800/30 to-gray-800/10"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
                whileHover={{ boxShadow: "0 0 15px rgba(20, 184, 166, 0.1)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <motion.span 
                    className="text-sm text-gray-400"
                    whileHover={{ x: 2 }}
                  >
                    总进度
                  </motion.span>
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
                    <StatusPill
                      label={`${totalPercentage.toFixed(1)}%`}
                      variant={totalPercentage === 100 ? "success" : hasRunningTasks ? "info" : "default"}
                      size="sm"
                      animate
                      pulseIcon={hasRunningTasks}
                    />
                  </div>
                </div>
                <div className="relative">
                  <Progress
                    value={totalPercentage}
                    className="h-2"
                  />
                  {hasRunningTasks && (
                    <motion.div
                      className="absolute h-2 bg-white/30 w-1 top-0 rounded-full"
                      initial={{ left: "0%" }}
                      animate={{ 
                        left: [`${Math.max(0, totalPercentage - 3)}%`, `${Math.min(100, totalPercentage + 3)}%`]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </div>
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
                      layout
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
                    <motion.div
                      animate={{ 
                        scale: [1, 1.05, 1],
                        opacity: [0.5, 0.8, 0.5] 
                      }}
                      transition={{ 
                        duration: 3, 
                        repeat: Infinity,
                        repeatType: "reverse" 
                      }}
                    >
                      <AlertTriangle className="w-12 h-12 mb-4 opacity-50" />
                    </motion.div>
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
