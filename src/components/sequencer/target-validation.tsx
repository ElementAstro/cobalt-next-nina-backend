"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Info, Loader2 } from "lucide-react";
import { useSequencerStore } from "@/stores/sequencer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import type { Target } from "@/stores/sequencer";

export function TargetValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [currentTargetId, setCurrentTargetId] = useState<string | null>(null);
  const { targets, activeTargetId, validateTarget } = useSequencerStore();

  const activeTarget = targets.find((t: Target) => t.id === activeTargetId);

  const handleValidateTarget = useCallback(async (targetId: string) => {
    setCurrentTargetId(targetId);
    setIsValidating(true);
    try {
      const result = await validateTarget(targetId);
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
    } finally {
      setCurrentTargetId(null);
      setIsValidating(false);
    }
  }, [validateTarget]);

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
              <Shield className="w-5 h-5 text-gray-400" />
              目标验证
            </CardTitle>
            <CardDescription>
              验证目标配置并检查潜在问题
            </CardDescription>
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
                  <Shield className="w-5 h-5 text-teal-500" />
                </motion.div>
                <CardTitle className="text-xl">目标验证</CardTitle>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        size="sm"
                        onClick={() => handleValidateTarget(activeTarget.id)}
                        disabled={isValidating}
                        className="h-8 bg-teal-600 hover:bg-teal-700 text-white transition-all group"
                      >
                        {isValidating && currentTargetId === activeTarget.id ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="mr-2"
                          >
                            <Loader2 className="w-4 h-4" />
                          </motion.div>
                        ) : (
                          <motion.div 
                            className="mr-2 group-hover:rotate-180"
                            transition={{ duration: 0.3 }}
                          >
                            <Shield className="w-4 h-4" />
                          </motion.div>
                        )}
                        验证当前目标
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>验证当前选中的目标配置</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription>
              验证目标配置并检查潜在问题
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              <motion.div
                className="rounded-lg border border-gray-800 bg-gray-800/20 p-4 hover:border-gray-700 transition-colors"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 30 }}
                whileHover={{ boxShadow: "0 0 15px rgba(20, 184, 166, 0.1)" }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="text-sm text-gray-400">目标名称</label>
                    <p className="text-base text-gray-200 font-medium mt-1">{activeTarget.name}</p>
                  </motion.div>
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className="text-sm text-gray-400">分类</label>
                    <p className="text-base text-gray-200 mt-1">
                      <Badge variant="secondary">{activeTarget.category}</Badge>
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label className="text-sm text-gray-400">赤经</label>
                    <p className="text-base text-gray-200 font-mono mt-1">
                      {activeTarget.coordinates.ra.h}h {activeTarget.coordinates.ra.m}m{" "}
                      {activeTarget.coordinates.ra.s}s
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <label className="text-sm text-gray-400">赤纬</label>
                    <p className="text-base text-gray-200 font-mono mt-1">
                      {activeTarget.coordinates.dec.d}° {activeTarget.coordinates.dec.m}&apos;{" "}
                      {activeTarget.coordinates.dec.s}&quot;
                    </p>
                  </motion.div>
                </div>
              </motion.div>

              <motion.div
                className="flex items-center gap-2 p-4 bg-gradient-to-r from-gray-800/30 to-gray-800/10 rounded-lg"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, type: "spring" }}
                whileHover={{ backgroundColor: "rgba(20, 184, 166, 0.05)" }}
              >
                <Info className="w-4 h-4 text-teal-400" />
                <p className="text-sm text-gray-400">
                  当前选中目标有 {" "}
                  <span className="text-teal-400 font-medium">{activeTarget.tasks.length}</span>
                  {" "} 个任务需要验证
                </p>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}