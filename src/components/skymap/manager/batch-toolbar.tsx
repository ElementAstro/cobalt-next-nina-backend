import React, { FC } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Trash2, Star, Flag, Search } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BatchOperationToolbarProps {
  selectedCount: number;
  onCancel: () => void;
  onBatchDelete: () => void;
  onBatchExport: () => void;
  onBatchUpdateTag: () => void;
  onBatchUpdateFlag: () => void;
  onFocusTarget: () => void;
}

const BatchOperationToolbar: FC<BatchOperationToolbarProps> = ({
  selectedCount,
  onCancel,
  onBatchDelete,
  onBatchExport,
  onBatchUpdateTag,
  onBatchUpdateFlag,
  onFocusTarget,
}) => {
  const toolbarVariants = {
    hidden: { y: 100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: { 
      y: 100, 
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={toolbarVariants}
        className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 shadow-lg z-50"
      >
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg font-medium text-indigo-400"
          >
            已选择 {selectedCount} 个目标
          </motion.span>
          <div className="flex flex-wrap justify-center gap-2">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                    <Button 
                      variant="ghost" 
                      onClick={onCancel}
                      className="group hover:bg-gray-800 transition-all duration-300"
                    >
                      <X className="w-4 h-4 mr-2 group-hover:text-red-400 transition-colors" />
                      取消选择
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-gray-900 text-white">
                  <p>取消所有已选目标</p>
                </TooltipContent>
              </Tooltip>

              {selectedCount === 1 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                      <Button 
                        variant="ghost" 
                        onClick={onFocusTarget}
                        className="group hover:bg-gray-800 transition-all duration-300"
                      >
                        <Search className="w-4 h-4 mr-2 group-hover:text-blue-400 transition-colors" />
                        聚焦目标
                      </Button>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-gray-900 text-white">
                    <p>聚焦到选中的目标</p>
                  </TooltipContent>
                </Tooltip>
              )}

              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                    <Button 
                      variant="ghost" 
                      onClick={onBatchUpdateTag}
                      className="group hover:bg-gray-800 transition-all duration-300"
                    >
                      <Star className="w-4 h-4 mr-2 group-hover:text-yellow-400 transition-colors" />
                      批量标签
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-gray-900 text-white">
                  <p>为所有选中的目标添加标签</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                    <Button 
                      variant="ghost" 
                      onClick={onBatchUpdateFlag}
                      className="group hover:bg-gray-800 transition-all duration-300"
                    >
                      <Flag className="w-4 h-4 mr-2 group-hover:text-green-400 transition-colors" />
                      批量标记
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-gray-900 text-white">
                  <p>为所有选中的目标添加标记</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                    <Button 
                      variant="ghost" 
                      onClick={onBatchExport}
                      className="group hover:bg-gray-800 transition-all duration-300"
                    >
                      <Download className="w-4 h-4 mr-2 group-hover:text-purple-400 transition-colors" />
                      导出选中
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-gray-900 text-white">
                  <p>导出所有选中的目标</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                    <Button 
                      variant="ghost" 
                      onClick={onBatchDelete}
                      className="group hover:bg-red-900/20 transition-all duration-300"
                    >
                      <Trash2 className="w-4 h-4 mr-2 group-hover:text-red-400 transition-colors" />
                      批量删除
                    </Button>
                  </motion.div>
                </TooltipTrigger>
                <TooltipContent side="top" className="bg-gray-900 text-white">
                  <p className="text-red-400">删除所有选中的目标 (不可恢复)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BatchOperationToolbar;
