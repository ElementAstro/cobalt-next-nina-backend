import React, { FC } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
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
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 p-4 bg-gray-800 border-t border-gray-700"
    >
      <div className="container mx-auto flex justify-between items-center">
        <span>已选择 {selectedCount} 个目标</span>
        <div className="space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={onCancel}>
                  <X className="w-4 h-4 mr-2" />
                  取消选择
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>取消所有已选目标</p>
              </TooltipContent>
            </Tooltip>

            {selectedCount === 1 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" onClick={onFocusTarget}>
                    <Search className="w-4 h-4 mr-2" />
                    聚焦目标
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>聚焦到选中的目标</p>
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={onBatchUpdateTag}>
                  <Star className="w-4 h-4 mr-2" />
                  批量标签
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>为所有选中的目标添加标签</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={onBatchUpdateFlag}>
                  <Flag className="w-4 h-4 mr-2" />
                  批量标记
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>为所有选中的目标添加标记</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={onBatchExport}>
                  <Download className="w-4 h-4 mr-2" />
                  导出选中
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>导出所有选中的目标</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="destructive" onClick={onBatchDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  批量删除
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>删除所有选中的目标 (不可恢复)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </motion.div>
  );
};

export default BatchOperationToolbar;
