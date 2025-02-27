"use client";

import { PropsWithChildren, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SortableItemProps {
  value: string;
  disabled?: boolean;
  showHandle?: boolean;
  dragOverlay?: boolean;
  className?: string;
}

export const SortableItem = memo(({
  value,
  disabled = false,
  showHandle = true,
  dragOverlay = false,
  className = "",
  children,
}: PropsWithChildren<SortableItemProps>) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
    over,
  } = useSortable({
    id: value,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isSorting ? transition : undefined,
  };

  // 拖拽手柄组件
  const DragHandle = showHandle ? (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={`
              flex items-center justify-center w-8 h-full
              cursor-grab active:cursor-grabbing
              text-gray-400 hover:text-gray-300
              transition-colors
              ${disabled ? "cursor-not-allowed opacity-50" : ""}
            `}
            {...attributes}
            {...listeners}
            role="button"
            aria-label="拖拽排序"
            tabIndex={disabled ? -1 : 0}
          >
            <GripVertical className="w-4 h-4" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>拖拽排序</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : null;

  return (
    <AnimatePresence>
      <motion.div
        ref={setNodeRef}
        style={style}
        initial={false}
        animate={{
          scale: isDragging ? 1.02 : 1,
          boxShadow: isDragging
            ? "0 8px 24px rgba(0, 0, 0, 0.3)"
            : "none",
          zIndex: isDragging ? 2 : 0,
          opacity: dragOverlay ? 0.8 : 1,
        }}
        transition={{
          duration: 0.2,
          ease: "easeInOut",
        }}
        className={`
          relative flex items-stretch
          touch-none select-none
          outline-none
          ${isDragging ? "z-50" : ""}
          ${dragOverlay ? "cursor-grabbing shadow-2xl" : ""}
          ${over ? "ring-2 ring-teal-500/30" : ""}
          ${className}
        `}
        role="listitem"
        aria-grabbed={isDragging}
        aria-dropeffect="move"
      >
        {/* 拖拽时的视觉效果 */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>

        {/* 左侧拖拽手柄 */}
        {showHandle && DragHandle}

        {/* 主要内容区域 */}
        <div className="flex-1 outline-none">
          {children}
        </div>

        {/* 右侧拖拽手柄 */}
        {showHandle && (
          <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center">
            {DragHandle}
          </div>
        )}

        {/* 拖拽状态效果 */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              className="absolute inset-0 bg-teal-500/5 pointer-events-none rounded-lg"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>

        {/* 键盘焦点指示器 */}
        <motion.div
          className={`
            absolute inset-0 rounded-lg ring-2 ring-teal-500/50 ring-offset-2 ring-offset-gray-900
            pointer-events-none opacity-0 
            focus-within:opacity-100
          `}
          initial={false}
          transition={{ duration: 0.2 }}
        />
      </motion.div>
    </AnimatePresence>
  );
});

SortableItem.displayName = "SortableItem";
