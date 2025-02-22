import React, { FC, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Edit2, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  renameText: string;
  setRenameText: React.Dispatch<React.SetStateAction<string>>;
  handleRenameClose: (save: boolean) => void;
}

const RenameDialog: FC<RenameDialogProps> = ({
  open,
  onOpenChange,
  renameText,
  setRenameText,
  handleRenameClose,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // 重置状态
  useEffect(() => {
    if (open) {
      setError(null);
      setIsSuccess(false);
    }
  }, [open, renameText]);

  const validateInput = (text: string): string | null => {
    if (!text.trim()) {
      return "名称不能为空";
    }

    if (text.length > 255) {
      return "名称不能超过255个字符";
    }

    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(text)) {
      return '名称包含无效字符 (例如: <>:"/\\|?*)';
    }

    // 检查特殊规则
    if (!/^[a-zA-Z0-9\u4e00-\u9fa5\s_-]+$/.test(text)) {
      return "名称只能包含中文、英文、数字、空格、下划线和连字符";
    }

    return null;
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRenameText(event.target.value);
    setError(null);
    setIsSuccess(false);
  };

  const handleConfirm = async () => {
    const validationError = validateInput(renameText);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setIsSuccess(true);
      // 等待动画完成后关闭
      setTimeout(() => {
        handleRenameClose(true);
      }, 500);
    } catch (error: unknown) {
      console.error("重命名失败:", error instanceof Error ? error.message : "未知错误");
      setError(`重命名失败: ${error instanceof Error ? error.message : "请检查名称格式或稍后重试"}`);
      setIsSuccess(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900/95 backdrop-blur-md border-gray-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-indigo-400">
            <Edit2 className="w-5 h-5" />
            重命名目标
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="relative">
            <Input
              type="text"
              placeholder="输入新的名称..."
              value={renameText}
              onChange={handleInputChange}
              className={cn(
                "bg-gray-800/50 border-gray-700",
                "focus:border-indigo-500 transition-all duration-200",
                error && "border-red-500 focus:border-red-500",
                isSuccess && "border-green-500 focus:border-green-500"
              )}
            />
            
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              {error && (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              {isSuccess && (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
            </motion.div>

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
            <p>• 支持中文、英文、数字</p>
            <p>• 可使用空格、下划线和连字符</p>
            <p>• 最大长度为255个字符</p>
            <p>• 不能包含特殊字符</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={() => handleRenameClose(false)}
              className="bg-gray-800 hover:bg-gray-700 border-gray-700"
            >
              取消
            </Button>
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              type="submit"
              onClick={handleConfirm}
              className={cn(
                "transition-all duration-200",
                isSuccess
                  ? "bg-green-600 hover:bg-green-500"
                  : "bg-indigo-600 hover:bg-indigo-500"
              )}
              disabled={!!error || isSuccess}
            >
              {isSuccess ? "重命名成功" : "确认"}
            </Button>
          </motion.div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RenameDialog;
