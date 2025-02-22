"use client";

import { PropsWithChildren } from "react";
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
}

export function SortableItem({
  value,
  disabled = false,
  showHandle = true,
  dragOverlay = false,
  children,
}: PropsWithChildren<SortableItemProps>) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({
    id: value,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isSorting ? transition : undefined,
  };

  // Drag handle element
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
          ${isDragging ? "z-50" : ""}
          ${dragOverlay ? "cursor-grabbing shadow-2xl" : ""}
        `}
      >
        {/* Drag overlay effect */}
        {isDragging && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-transparent pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}

        {/* Left drag handle */}
        {showHandle && DragHandle}

        {/* Main content */}
        <div className="flex-1">
          {children}
        </div>

        {/* Right drag handle */}
        {showHandle && (
          <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center">
            {DragHandle}
          </div>
        )}

        {/* Active/hover states */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={false}
          animate={{
            opacity: isDragging ? 1 : 0,
            backgroundColor: isDragging
              ? "rgba(0, 0, 0, 0.05)"
              : "rgba(0, 0, 0, 0)",
          }}
          transition={{ duration: 0.2 }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
