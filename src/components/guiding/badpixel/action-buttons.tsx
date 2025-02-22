"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  RotateCcw,
  Play,
  Plus,
  Loader2,
  AlertTriangle,
} from "lucide-react";
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
}

const ActionButtons = memo(({
  resetCorrectionLevels,
  generateBadPixels,
  handleManualAddPixel,
  manualPixel,
  setManualPixel,
  isGenerating = false,
}: ActionButtonsProps) => {
  const { toast } = useToast();
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  const handleAddPixel = async () => {
    try {
      const parsedPixel = pixelSchema.parse(Number(manualPixel));
      await handleManualAddPixel(parsedPixel);
      setManualPixel("");
      toast({
        title: "成功添加坏点",
        description: `坐标 ${parsedPixel} 已添加`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "输入错误",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "添加失败",
          description: "未知错误",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      {/* 按钮组 */}
      <div className="grid grid-cols-3 gap-2">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
                onClick={resetCorrectionLevels}
                className={cn(
                  "w-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors",
                  "border-gray-600 hover:border-gray-500"
                )}
              >
                <RotateCcw className={cn(
                  "mr-2",
                  isMobile ? "h-4 w-4" : "h-5 w-5"
                )} />
                重置
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>重置所有校正级别</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
                onClick={generateBadPixels}
                disabled={isGenerating}
                className={cn(
                  "w-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors",
                  "border-gray-600 hover:border-gray-500"
                )}
              >
                {isGenerating ? (
                  <Loader2 className={cn(
                    "animate-spin mr-2",
                    isMobile ? "h-4 w-4" : "h-5 w-5"
                  )} />
                ) : (
                  <Play className={cn(
                    "mr-2",
                    isMobile ? "h-4 w-4" : "h-5 w-5"
                  )} />
                )}
                {isGenerating ? "生成中" : "生成"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>自动生成坏点数据</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
                onClick={handleAddPixel}
                disabled={!manualPixel}
                className={cn(
                  "w-full bg-gray-800/50 hover:bg-gray-700/50 transition-colors",
                  "border-gray-600 hover:border-gray-500"
                )}
              >
                <Plus className={cn(
                  "mr-2",
                  isMobile ? "h-4 w-4" : "h-5 w-5"
                )} />
                增加
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>手动添加坏点</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* 手动输入区域 */}
      <div className="relative">
        <Input
          type="number"
          value={manualPixel}
          onChange={(e) => setManualPixel(e.target.value)}
          placeholder={isMobile ? "输入坐标" : "输入像素坐标 (0 - 11696767)"}
          className={cn(
            "w-full bg-gray-800/50 border-gray-600",
            "focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
            "placeholder:text-gray-500"
          )}
        />
        <AnimatePresence>
          {manualPixel && !pixelSchema.safeParse(Number(manualPixel)).success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute -top-6 left-0 flex items-center text-red-400 text-xs"
            >
              <AlertTriangle className="w-3 h-3 mr-1" />
              <span>无效的坐标值</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

ActionButtons.displayName = "ActionButtons";

export default ActionButtons;
