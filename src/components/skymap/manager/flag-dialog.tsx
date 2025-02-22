import React, { FC, useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Flag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FlagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flagText: string;
  setFlagText: (text: string) => void;
  handleFlagClose: (save: boolean) => void;
  isBatchMode?: boolean;
  onBatchUpdate?: (value: string) => void;
}

const FlagDialog: FC<FlagDialogProps> = ({
  open,
  onOpenChange,
  flagText,
  setFlagText,
  handleFlagClose,
  isBatchMode,
  onBatchUpdate,
}) => {
  const [error, setError] = useState<string | null>(null);

  // 重置错误状态
  useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open, flagText]);

  // 验证输入
  const validateInput = (text: string): string | null => {
    if (!text.trim()) {
      return "标记不能为空";
    }
    if (text.length > 50) {
      return "标记长度不能超过50个字符";
    }
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(text)) {
      return '标记不能包含特殊字符 (<>:"/\\|?*)';
    }
    return null;
  };

  // 处理保存
  const handleSave = () => {
    const validationError = validateInput(flagText);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (isBatchMode && onBatchUpdate) {
      onBatchUpdate(flagText);
    } else {
      handleFlagClose(true);
    }
  };

  const dialogVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 10,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        duration: 0.3,
        bounce: 0.2,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 10,
      transition: {
        duration: 0.2,
      },
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
              <Flag className="w-5 h-5" />
              {isBatchMode ? "批量更新标记" : "更新标记"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type="text"
                    value={flagText}
                    onChange={(e) => {
                      setFlagText(e.target.value);
                      setError(null); // 清除错误提示
                    }}
                    placeholder="输入新的标记..."
                    className={`bg-gray-800/50 border-gray-700 focus:border-indigo-500 transition-all duration-300 ${
                      error ? "border-red-500" : ""
                    }`}
                  />
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute -bottom-6 left-0 text-red-400 text-sm"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="text-sm text-gray-400 mt-2">
                  <p>• 标记用于快速识别和分类目标</p>
                  <p>• 长度限制为50个字符</p>
                  <p>• 不能包含特殊字符</p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="space-x-2">
            <AlertDialogCancel
              onClick={() => handleFlagClose(false)}
              className="bg-gray-800 hover:bg-gray-700 border-gray-700 transition-colors duration-200"
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSave}
              className="bg-indigo-600 hover:bg-indigo-500 transition-colors duration-200"
            >
              保存
            </AlertDialogAction>
          </AlertDialogFooter>
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default FlagDialog;
