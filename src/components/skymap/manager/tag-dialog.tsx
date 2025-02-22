import React, { FC, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { Star, AlertCircle, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tagValue: string;
  setTagValue: (value: string) => void;
  all_tags: string[];
  handleTagSelection: (value: string) => void;
  handleTagClose: () => void;
  isBatchMode?: boolean;
  onBatchUpdate?: (value: string) => void;
}

const TagDialog: FC<TagDialogProps> = ({
  open,
  onOpenChange,
  tagValue,
  all_tags,
  handleTagSelection,
  handleTagClose,
  isBatchMode,
  onBatchUpdate,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSave = () => {
    if (!tagValue || tagValue === "all") {
      setError("请选择有效的标签");
      return;
    }

    try {
      setIsSuccess(true);
      if (isBatchMode && onBatchUpdate) {
        onBatchUpdate(tagValue);
      } else {
        handleTagClose();
      }
    } catch (error: unknown) {
      console.error("标签更新失败:", error instanceof Error ? error.message : "未知错误");
      setError(`更新失败: ${error instanceof Error ? error.message : "请稍后重试"}`);
      setIsSuccess(false);
    }
  };

  const dialogVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        duration: 0.4,
        bounce: 0.3,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: { duration: 0.2 },
    },
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent asChild>
        <motion.div
          variants={dialogVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="bg-gray-900/95 backdrop-blur-md border border-gray-800 shadow-xl"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl text-indigo-400">
              <Star className="w-5 h-5" />
              {isBatchMode ? "批量更新标签" : "更新标签"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <div className="relative">
                <Select
                  value={tagValue}
                  onValueChange={(value) => {
                    handleTagSelection(value);
                    setError(null);
                  }}
                >
                  <SelectTrigger
                    className={cn(
                      "w-full bg-gray-800/50 border-gray-700",
                      "hover:bg-gray-700/50 transition-colors duration-200",
                      error && "border-red-500",
                      isSuccess && "border-green-500"
                    )}
                  >
                    <SelectValue placeholder="选择标签..." />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 border-gray-700">
                    {all_tags.length === 0 ? (
                      <div className="p-4 text-center text-gray-400">
                        <PlusCircle className="w-6 h-6 mx-auto mb-2" />
                        <p>暂无可用标签</p>
                        <p className="text-sm">请先创建标签</p>
                      </div>
                    ) : (
                      all_tags.map((tag) => (
                        <SelectItem
                          key={tag}
                          value={tag}
                          className="focus:bg-gray-700/50"
                        >
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-400" />
                            {tag}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-sm mt-2 flex items-center gap-1"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </motion.p>
                )}
              </div>

              <div className="text-sm text-gray-400 space-y-1">
                <p>• 标签用于对目标进行分类和组织</p>
                <p>• 可以随时修改标签</p>
                <p>• 相同标签的目标可以批量操作</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="space-x-2">
            <AlertDialogCancel
              onClick={() => onOpenChange(false)}
              className="bg-gray-800 hover:bg-gray-700 border-gray-700 transition-colors duration-200"
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSave}
              className={cn(
                "transition-all duration-200",
                isSuccess
                  ? "bg-green-600 hover:bg-green-500"
                  : "bg-indigo-600 hover:bg-indigo-500",
                error && "bg-gray-600 hover:bg-gray-500 cursor-not-allowed"
              )}
              disabled={!!error || isSuccess}
            >
              {isSuccess ? "更新成功" : "保存"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default TagDialog;
