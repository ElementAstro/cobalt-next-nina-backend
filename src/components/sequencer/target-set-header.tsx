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
        className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-900/80 to-gray-900/50 backdrop-blur-md border-b border-gray-800 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse"
            }}
          >
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </motion.div>
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
      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-900/80 to-gray-900/50 backdrop-blur-md border-b border-gray-800 shadow-sm"
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <motion.div
            whileHover={{ rotate: 360, scale: 1.2 }}
            transition={{ duration: 0.5 }}
          >
            <Star className="w-5 h-5 text-yellow-500" />
          </motion.div>
          <motion.h2 
            className="text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent"
            whileHover={{ x: 3 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {activeTarget.name}
          </motion.h2>
          <Badge variant="secondary" className="text-xs">
            {activeTarget.category}
          </Badge>
        </div>
        <div className="text-sm text-gray-400">
          <motion.span 
            className="inline-flex items-center gap-1"
            whileHover={{ y: -2 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Clock className="w-4 h-4" />
            {activeTarget.tasks.length} 个任务
          </motion.span>
        </div>
        <motion.div 
          className="h-8 w-px bg-gray-800"
          whileHover={{ height: 16, backgroundColor: "rgba(20, 184, 166, 0.5)" }}
          transition={{ duration: 0.2 }}
        />
        <div className="flex items-center gap-2">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "8rem" }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="w-32"
          >
            <Progress value={getCompletionPercentage()} 
              className={`h-2 ${
                getCompletionPercentage() > 70 
                ? "bg-teal-900/50" 
                : getCompletionPercentage() > 30 
                  ? "bg-blue-900/50"
                  : "bg-gray-800"
              }`}
            />
          </motion.div>
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-gray-400"
          >
            {Math.round(getCompletionPercentage())}%
          </motion.span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            className="flex items-center gap-2 px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-4 h-4 text-teal-500" />
            </motion.div>
            <span className="text-sm text-teal-500">运行中</span>
          </motion.div>
        )}

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isRunning ? pauseSequence : startSequence}
                  className={`h-8 transition-all ${
                    isRunning 
                      ? "bg-amber-600/10 text-amber-400 border-amber-500/50 hover:bg-amber-600/20" 
                      : "bg-teal-600/10 text-teal-400 border-teal-500/50 hover:bg-teal-600/20"
                  }`}
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
                      <motion.div
                        animate={{ 
                          scale: [1, 1.2, 1],
                          rotate: [0, 5, 0, -5, 0]
                        }}
                        transition={{ 
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse"
                        }}
                        className="mr-2"
                      >
                        <Star className="w-4 h-4" />
                      </motion.div>
                      开始执行
                    </>
                  )}
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isRunning ? "暂停执行" : "开始执行"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
          <motion.div whileHover={{ rotate: 90 }} transition={{ duration: 0.2 }}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-800/50">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
          </motion.div>
          <DropdownMenuContent align="end" className="bg-gray-900 border-gray-800">
            <DropdownMenuLabel>目标操作</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleValidate} className="group">
              <motion.div
                whileHover={{ rotate: 180 }}
                transition={{ duration: 0.2 }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
              </motion.div>
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
