"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "react-responsive";

interface Tab {
  id: string;
  name: string;
  href: string;
  icon?: React.ElementType;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  direction?: "horizontal" | "vertical";
  theme?: "light" | "dark" | "auto";
  closable?: boolean;
  draggable?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "pill";
  fullWidth?: boolean;
  showIcons?: boolean;
  onChange?: (tabs: Tab[]) => void;
  onClose?: (tab: Tab) => void;
}

interface SortableTabProps {
  tab: Tab;
  isActive: boolean;
  theme: TabsProps["theme"];
  size: TabsProps["size"];
  variant: TabsProps["variant"];
  closable?: boolean;
  draggable?: boolean;
  showIcons?: boolean;
  onClose?: (tab: Tab) => void;
}

const SortableTab = ({
  tab,
  isActive,
  theme,
  size,
  variant,
  closable,
  draggable,
  showIcons,
  onClose,
}: SortableTabProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "relative group",
        isDragging && "cursor-grabbing",
        !isDragging && draggable && "cursor-grab"
      )}
      {...attributes}
    >
      <Link
        href={tab.href}
        className={cn(
          "relative flex items-center gap-2 rounded-md transition-colors",
          size === "sm" && "px-2.5 py-1.5 text-sm",
          size === "md" && "px-3 py-2",
          size === "lg" && "px-4 py-2.5 text-lg",
          variant === "pill" && "rounded-full",
          isActive
            ? theme === "dark"
              ? "bg-gray-800 text-white"
              : "bg-primary text-primary-foreground"
            : theme === "dark"
            ? "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
            : "text-muted-foreground hover:text-foreground hover:bg-muted",
          tab.disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={(e) => tab.disabled && e.preventDefault()}
      >
        {draggable && (
          <GripVertical
            className={cn(
              "h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity",
              isDragging && "opacity-100"
            )}
            {...listeners}
          />
        )}
        {showIcons && tab.icon && <tab.icon className="h-4 w-4" />}
        <span className="truncate">{tab.name}</span>
        {closable && !tab.disabled && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onClose?.(tab);
            }}
            className={cn(
              "ml-1 rounded-full p-0.5 hover:bg-background/20",
              "opacity-0 group-hover:opacity-100 transition-opacity",
              "focus:outline-none focus:ring-2 focus:ring-primary"
            )}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </Link>
    </motion.div>
  );
};

export function Tabs({
  tabs: initialTabs,
  direction = "horizontal",
  theme = "light",
  closable = false,
  draggable = false,
  size = "md",
  variant = "default",
  fullWidth = false,
  showIcons = true,
  onChange,
  onClose,
}: TabsProps) {
  const [tabs, setTabs] = useState(initialTabs);
  const segment = useSelectedLayoutSegment();
  const [mounted, setMounted] = useState(false);

  const isSmallScreen = useMediaQuery({ query: "(max-width: 640px)" });
  const actualDirection = isSmallScreen ? "vertical" : direction;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setTabs(initialTabs);
  }, [initialTabs]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTabs((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        onChange?.(newItems);
        return newItems;
      });
    }
  };

  if (!mounted) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={tabs.map((tab) => tab.id)}
        strategy={
          actualDirection === "horizontal"
            ? horizontalListSortingStrategy
            : verticalListSortingStrategy
        }
      >
        <div
          className={cn(
            "relative",
            actualDirection === "horizontal" ? "flex" : "flex-col",
            fullWidth && "w-full",
            "gap-1"
          )}
        >
          <AnimatePresence>
            {tabs.map((tab) => {
              const isActive = Boolean(
                (tab.href === "/" && segment === null) ||
                  (segment && tab.href.startsWith(`/${segment}`))
              );

              return (
                <SortableTab
                  key={tab.id}
                  tab={tab}
                  isActive={isActive}
                  theme={theme}
                  size={size}
                  variant={variant}
                  closable={closable}
                  draggable={draggable}
                  showIcons={showIcons}
                  onClose={onClose}
                />
              );
            })}
          </AnimatePresence>
        </div>
      </SortableContext>
    </DndContext>
  );
}
