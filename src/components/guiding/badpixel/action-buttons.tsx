"use client";

import { memo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { RotateCcw, Play, Plus, Loader2, AlertTriangle } from "lucide-react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useMediaQuery } from "react-responsive";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const pixelSchema = z
  .number()
  .min(0, "像素坐标不能小于0")
  .max(4144 * 2822 - 1, "像素坐标超出范围");

interface ActionButtonsProps {
  resetCorrectionLevels: () => void;
  generateBadPixels: () => Promise<void>;
  handleManualAddPixel: (pixel: number) => void;
  manualPixel: string;
  setManualPixel: (value: string) => void;
  isGenerating?: boolean;
  isLoading?: boolean;
  error?: string | null;
}

const ButtonSkeleton = memo(({ isMobile }: { isMobile: boolean }) => (
  <motion.div
    className="grid grid-cols-3 gap-2"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
    role="status"
    aria-label="加载中"
  >
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: i * 0.1 }}
      >
        <Skeleton
          className={cn("h-10 rounded-md", isMobile ? "w-full" : "w-[100px]")}
        />
      </motion.div>
    ))}
  </motion.div>
));

ButtonSkeleton.displayName = "ButtonSkeleton";

const ActionButtons = memo(
  ({
    resetCorrectionLevels,
    generateBadPixels,
    handleManualAddPixel,
    manualPixel,
    setManualPixel,
    isGenerating = false,
    isLoading = false, // 修复一: 为可选的 isLoading 参数提供默认值
  }: ActionButtonsProps) => {
    const { toast } = useToast();
    const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

    // 使用useCallback优化回调函数
    const handleAddPixel = useCallback(async () => {
      if (!manualPixel.trim()) {
        toast({
          title: "输入错误",
          description: "请输入坏点坐标",
          variant: "destructive",
        });
        return;
      }

      try {
        const parsedPixel = pixelSchema.parse(Number(manualPixel));
        
        // 添加加载状态反馈
        toast({
          title: "正在添加坏点...",
          description: `正在处理坐标 ${parsedPixel}`,
        });

        try {
          await handleManualAddPixel(parsedPixel);
          setManualPixel("");
          toast({
            title: "成功添加坏点",
            description: `坐标 ${parsedPixel} 已添加`,
            variant: "default",
          });
        } catch (error) {
          toast({
            title: "添加失败",
            description: error instanceof Error ? error.message : "操作失败",
            variant: "destructive",
          });
        }
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast({
            title: "输入验证错误",
            description: error.errors[0].message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "系统错误",
            description: "处理过程中发生未知错误",
            variant: "destructive",
          });
          console.error("坏点添加错误:", error);
        }
      }
    }, [manualPixel, handleManualAddPixel, setManualPixel, toast]);

    // 优化输入处理

    if (isLoading) {
      return (
        <div className="space-y-4 p-4 bg-gray-900/30 rounded-lg border border-gray-800 shadow-lg">
          <ButtonSkeleton isMobile={isMobile} />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          staggerChildren: 0.1,
          when: "beforeChildren",
        }}
        className="space-y-4 p-4 bg-gray-900/30 rounded-lg border border-gray-800 shadow-lg"
        aria-label="坏点操作按钮组"
        whileHover={{
          scale: 1.01,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
        }}
        whileTap={{
          scale: 0.99,
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* 按钮组 */}
        <motion.div
          className="grid grid-cols-3 gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
            mass: 1
          }}
        >
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{
                    scale: 1.05,
                    transition: { duration: 0.1 },
                  }}
                  whileTap={{
                    scale: 0.95,
                    transition: { duration: 0.05 },
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  aria-label="重置按钮"
                >
                  <motion.div
                    whileHover={{
                      scale: 1.03,
                      boxShadow: "0 0 8px rgba(59, 130, 246, 0.5)",
                    }}
                    whileTap={{
                      scale: 0.97,
                      boxShadow: "0 0 4px rgba(59, 130, 246, 0.3)",
                    }}
                    className="relative overflow-hidden"
                  >
                    <Button
                      variant="outline"
                      size={isMobile ? "sm" : "default"}
                      onClick={resetCorrectionLevels}
                      className={cn(
                        "w-full bg-gray-800/50 hover:bg-gray-700/50 transition-all",
                        "border-gray-600 hover:border-gray-500",
                        "active:scale-95 active:bg-gray-600/50",
                        "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
                      )}
                      aria-busy={false}
                    >
                      <RotateCcw
                        className={cn("mr-2", isMobile ? "h-4 w-4" : "h-5 w-5")}
                      />
                      重置
                      <span className="sr-only">重置所有校正级别</span>
                    </Button>
                  </motion.div>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p>重置所有校正级别</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.03, transition: { duration: 0.1 } }}
                  whileTap={{ scale: 0.97, transition: { duration: 0.05 } }}
                  aria-label="生成按钮"
                >
                  <Button
                    variant="outline"
                    size={isMobile ? "sm" : "default"}
                    onClick={generateBadPixels}
                    disabled={isGenerating}
                    className={cn(
                      "w-full bg-gray-800/50 hover:bg-gray-700/50 transition-all",
                      "border-gray-600 hover:border-gray-500",
                      "active:scale-95 active:bg-gray-600/50",
                      "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900",
                      isGenerating && "cursor-not-allowed"
                    )}
                    aria-busy={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2
                          className={cn(
                            "animate-spin mr-2",
                            isMobile ? "h-4 w-4" : "h-5 w-5"
                          )}
                        />
                        <span className="sr-only">生成中</span>
                      </>
                    ) : (
                      <>
                        <Play
                          className={cn(
                            "mr-2",
                            isMobile ? "h-4 w-4" : "h-5 w-5"
                          )}
                        />
                        <span className="sr-only">生成坏点数据</span>
                      </>
                    )}
                    {isGenerating ? "生成中" : "生成"}
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p>自动生成坏点数据</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.03, transition: { duration: 0.1 } }}
                  whileTap={{ scale: 0.97, transition: { duration: 0.05 } }}
                  aria-label="增加按钮"
                >
                  <Button
                    variant="outline"
                    size={isMobile ? "sm" : "default"}
                    onClick={handleAddPixel}
                    disabled={!manualPixel}
                    className={cn(
                      "w-full bg-gray-800/50 hover:bg-gray-700/50 transition-all",
                      "border-gray-600 hover:border-gray-500",
                      "active:scale-95 active:bg-gray-600/50",
                      "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900",
                      !manualPixel && "cursor-not-allowed"
                    )}
                    aria-disabled={!manualPixel}
                  >
                    <Plus
                      className={cn("mr-2", isMobile ? "h-4 w-4" : "h-5 w-5")}
                    />
                    增加
                    <span className="sr-only">手动添加坏点</span>
                  </Button>
                </motion.div>
              </TooltipTrigger>
              <TooltipContent>
                <p>手动添加坏点</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </motion.div>

        {/* 手动输入区域 */}
        <motion.div
          className="relative"
          role="region"
          aria-label="坏点坐标输入"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 25
            }}
            whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
            whileFocus={{ scale: 1.02, transition: { duration: 0.2 } }}
          >
            <Input
              type="number"
              value={manualPixel}
              onChange={(e) => setManualPixel(e.target.value)}
              placeholder={
                isMobile ? "输入坐标" : "输入像素坐标 (0 - 11696767)"
              }
              className={cn(
                "w-full bg-gray-800/50 border-gray-600 transition-all",
                "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50",
                "placeholder:text-gray-500",
                manualPixel &&
                  !pixelSchema.safeParse(Number(manualPixel)).success
                  ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/30"
                  : "border-gray-600"
              )}
              aria-invalid={
                !!(
                  manualPixel &&
                  !pixelSchema.safeParse(Number(manualPixel)).success
                )
              }
              aria-describedby="pixel-error"
            />
          </motion.div>
          <AnimatePresence>
            {manualPixel &&
              !pixelSchema.safeParse(Number(manualPixel)).success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute -top-6 left-0 flex items-center text-red-400 text-xs"
                  id="pixel-error"
                  role="alert"
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  <span>无效的坐标值</span>
                </motion.div>
              )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    );
  }
);

ActionButtons.displayName = "ActionButtons";

export default ActionButtons;
