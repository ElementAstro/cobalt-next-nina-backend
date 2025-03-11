"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Shield,
  XCircle,
  Clock,
  Info,
} from "lucide-react";
import { useSequencerStore } from "@/stores/sequencer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import type { ValidationResult, Target } from "@/stores/sequencer";

interface ValidationStatusProps {
  status: ValidationResult["status"];
  children: React.ReactNode;
}

const ValidationStatus = ({ status, children }: ValidationStatusProps) => {
  const variants = {
    success: "bg-green-500/10 text-green-400 border-green-500/50",
    warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/50",
    error: "bg-red-500/10 text-red-400 border-red-500/50",
  };

  const baseClass = "border rounded-md px-2 py-0.5 text-xs font-medium inline-flex items-center gap-1";
  return (
    <motion.span 
      className={`${baseClass} ${variants[status]}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.span>
  );
};

export function TaskValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const {
    targets,
    activeTargetId,
    taskStatuses,
    validateTask,
    taskValidation,
  } = useSequencerStore();

  const activeTarget = targets.find((t: Target) => t.id === activeTargetId);

  const handleValidateTask = useCallback(
    async (taskId: string) => {
      if (isValidating) return;

      setCurrentTaskId(taskId);
      setIsValidating(true);
      try {
        await validateTask(taskId);
        toast({
          title: "任务验证完成",
          description: "已完成任务配置验证",
          variant: "default",
        });
      } catch (error) {
        toast({
          title: "验证失败",
          description: (error as Error).message,
          variant: "destructive",
        });
      } finally {
        setCurrentTaskId(null);
        setIsValidating(false);
      }
    },
    [isValidating, validateTask]
  );

  const handleValidateAll = useCallback(async () => {
    if (!activeTarget || isValidating) return;

    setIsValidating(true);
    try {
      for (const task of activeTarget.tasks) {
        setCurrentTaskId(task.id);
        await validateTask(task.id);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      toast({
        title: "批量验证完成",
        description: "已完成所有任务验证",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "批量验证失败",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setCurrentTaskId(null);
      setIsValidating(false);
    }
  }, [activeTarget, isValidating, validateTask]);

  const getTaskStatusDisplay = (taskId: string) => {
    const status = taskStatuses[taskId]?.status;
    const validation = taskValidation[taskId];

    if (!validation) {
      return (
        <ValidationStatus status="warning">
          <Clock className="w-3 h-3" />
          未验证
        </ValidationStatus>
      );
    }

    switch (status) {
      case "running":
        return (
          <ValidationStatus status="warning">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-3 h-3" />
            </motion.div>
            验证中
          </ValidationStatus>
        );
      case "completed":
        return (
          <ValidationStatus status="success">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              <CheckCircle className="w-3 h-3" />
            </motion.div>
            已通过
          </ValidationStatus>
        );
      case "failed":
        return (
          <ValidationStatus status="error">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              <XCircle className="w-3 h-3" />
            </motion.div>
            失败
          </ValidationStatus>
        );
      default:
        return (
          <ValidationStatus status="warning">
            <Clock className="w-3 h-3" />
            等待中
          </ValidationStatus>
        );
    }
  };

  const getSuccessRate = (validation?: ValidationResult) => {
    if (!validation || validation.attempts === 0) return 0;
    return (validation.successes / validation.attempts) * 100;
  };

  if (!activeTarget) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 hover:border-gray-700 transition-colors">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-400" />
              <CardTitle className="text-xl">任务验证</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-8 text-gray-400">
            <motion.div
              animate={{ 
                y: [0, -5, 0],
                opacity: [0.5, 0.8, 0.5] 
              }}
              transition={{ 
                duration: 2, 
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

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeTarget.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800 hover:border-gray-700 transition-colors">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <motion.div
                  whileHover={{ rotate: 15 }}
                  transition={{ type: "spring", stiffness: 300, damping: 10 }}
                >
                  <Shield className="w-5 h-5 text-teal-500" />
                </motion.div>
                <CardTitle className="text-xl">任务验证</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {activeTarget.tasks.length} 个任务
                </Badge>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      onClick={handleValidateAll}
                      disabled={isValidating || activeTarget.tasks.length === 0}
                      className="h-8 bg-teal-600 hover:bg-teal-700 text-white transition-all"
                    >
                      {isValidating ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="mr-2"
                        >
                          <Loader2 className="w-4 h-4" />
                        </motion.div>
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      验证全部任务
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>验证所有任务配置</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>

          <CardContent>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Table>
                <TableHeader className="bg-gray-800/50">
                  <TableRow>
                    <TableHead className="w-[200px]">任务名称</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">成功率</TableHead>
                    <TableHead className="text-right w-[100px]">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {activeTarget.tasks.map((task, index) => (
                      <motion.tr
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="group hover:bg-gray-800/30"
                      >
                        <TableCell className="font-medium">
                          <motion.div
                            whileHover={{ x: 3 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          >
                            {task.name}
                          </motion.div>
                        </TableCell>
                        <TableCell>
                          {getTaskStatusDisplay(task.id)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <motion.div className="w-[60px]"
                              initial={{ scaleX: 0 }}
                              animate={{ scaleX: 1 }}
                              transition={{ delay: index * 0.05 + 0.2 }}
                            >
                              <Progress
                                value={getSuccessRate(taskValidation[task.id])}
                                className="h-2"
                              />
                            </motion.div>
                            <motion.span 
                              className="text-sm text-gray-400"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.05 + 0.4 }}
                            >
                              {Math.round(getSuccessRate(taskValidation[task.id]))}%
                            </motion.span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleValidateTask(task.id)}
                                  disabled={isValidating}
                                  className="h-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-teal-500/20"
                                >
                                  {currentTaskId === task.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <motion.div
                                      whileHover={{ rotate: 180 }}
                                      transition={{ duration: 0.3 }}
                                    >
                                      <RefreshCw className="w-4 h-4" />
                                    </motion.div>
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>重新验证此任务</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>

              {activeTarget.tasks.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center p-8 text-gray-400"
                >
                  <motion.div
                    animate={{ 
                      scale: [1, 1.05, 1],
                      opacity: [0.5, 0.7, 0.5] 
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      repeatType: "reverse" 
                    }}
                  >
                    <Info className="w-12 h-12 mb-4 opacity-50" />
                  </motion.div>
                  <p>当前目标没有任务</p>
                </motion.div>
              )}
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
