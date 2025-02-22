"use client";

import { memo, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ImageIcon,
  Settings,
  Wrench,
  Code,
  Briefcase,
  MessageCircle,
  Shield,
  LayoutGrid,
  LayoutList,
  ChevronRight,
  X,
} from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon: JSX.Element;
  count?: number;
}

interface CategoryFilterProps {
  selectedCategory: string | string[] | null;
  onSelectCategory: (category: string | string[] | null) => void;
  orientation?: "horizontal" | "vertical";
  showCounts?: boolean;
  categoryCounts?: Record<string, number>;
  enableMultiSelect?: boolean;
  animate?: boolean;
}

const categories: Category[] = [
  {
    id: "microsoft",
    name: "微软应用",
    icon: <ImageIcon className="h-4 w-4" />,
    description: "Microsoft Office 和其他微软应用",
  },
  {
    id: "system",
    name: "系统工具",
    icon: <Settings className="h-4 w-4" />,
    description: "系统维护和管理工具",
  },
  {
    id: "tools",
    name: "常用工具",
    icon: <Wrench className="h-4 w-4" />,
    description: "日常使用的实用工具",
  },
  {
    id: "development",
    name: "开发工具",
    icon: <Code className="h-4 w-4" />,
    description: "编程和开发相关工具",
  },
  {
    id: "media",
    name: "媒体工具",
    icon: <ImageIcon className="h-4 w-4" />,
    description: "媒体处理和编辑工具",
  },
  {
    id: "productivity",
    name: "效率工具",
    icon: <Briefcase className="h-4 w-4" />,
    description: "提升工作效率的工具",
  },
  {
    id: "communication",
    name: "通讯工具",
    icon: <MessageCircle className="h-4 w-4" />,
    description: "即时通讯和协作工具",
  },
  {
    id: "security",
    name: "安全工具",
    icon: <Shield className="h-4 w-4" />,
    description: "安全防护和加密工具",
  },
];

const CategoryButton = memo(
  ({
    category,
    isSelected,
    onClick,
    orientation,
    count,
    layout,
    showRemoveButton,
    onRemove,
  }: {
    category: Category;
    isSelected: boolean;
    onClick: () => void;
    orientation: "horizontal" | "vertical";
    count?: number;
    layout: "compact" | "normal";
    showRemoveButton?: boolean;
    onRemove?: () => void;
  }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant={isSelected ? "default" : "outline"}
            onClick={onClick}
            className={cn(
              "whitespace-nowrap flex items-center gap-2 transition-all group",
              orientation === "vertical" && "w-full justify-start",
              layout === "compact" && "px-3",
              isSelected && "ring-2 ring-primary ring-offset-2"
            )}
            size={layout === "compact" ? "sm" : "default"}
          >
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2"
            >
              {category.icon}
              <span>{category.name}</span>
            </motion.span>
            {count !== undefined && (
              <Badge
                variant="secondary"
                className={cn(
                  "ml-auto transition-transform",
                  isSelected && "bg-primary/20"
                )}
              >
                {count}
              </Badge>
            )}
            {showRemoveButton && isSelected && (
              <Button
                variant="ghost"
                size="icon"
                className="ml-1 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove?.();
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            {orientation === "vertical" && (
              <ChevronRight
                className={cn(
                  "ml-auto h-4 w-4 transition-transform",
                  isSelected && "rotate-90"
                )}
              />
            )}
          </Button>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side={orientation === "vertical" ? "right" : "bottom"}>
        <p>{category.description || category.name}</p>
        {count !== undefined && (
          <p className="text-xs text-muted-foreground">{count} 个应用</p>
        )}
      </TooltipContent>
    </Tooltip>
  )
);

CategoryButton.displayName = "CategoryButton";

export const CategoryFilter = memo(
  ({
    selectedCategory,
    onSelectCategory,
    orientation = "horizontal",
    showCounts = false,
    categoryCounts = {},
    enableMultiSelect = false,
    animate = true,
  }: CategoryFilterProps) => {
    const [layout, setLayout] = useState<"compact" | "normal">("normal");

    const selectedCategories = useMemo(
      () =>
        Array.isArray(selectedCategory)
          ? selectedCategory
          : selectedCategory
          ? [selectedCategory]
          : [],
      [selectedCategory]
    );

    const totalCount = useMemo(
      () => Object.values(categoryCounts).reduce((acc, curr) => acc + curr, 0),
      [categoryCounts]
    );

    const handleCategoryClick = (categoryId: string) => {
      if (!enableMultiSelect) {
        onSelectCategory(categoryId);
        return;
      }

      if (selectedCategories.includes(categoryId)) {
        // 如果已选中，则移除
        const newSelected = selectedCategories.filter(
          (id) => id !== categoryId
        );
        onSelectCategory(newSelected.length ? newSelected : null);
      } else {
        // 如果未选中，则添加
        onSelectCategory([...selectedCategories, categoryId]);
      }
    };

    const handleRemoveCategory = (categoryId: string) => {
      if (!enableMultiSelect) return;
      const newSelected = selectedCategories.filter((id) => id !== categoryId);
      onSelectCategory(newSelected.length ? newSelected : null);
    };

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setLayout((l) => (l === "normal" ? "compact" : "normal"))
              }
              className="flex items-center gap-2"
            >
              {layout === "normal" ? (
                <>
                  <LayoutList className="h-4 w-4" />
                  切换到紧凑视图
                </>
              ) : (
                <>
                  <LayoutGrid className="h-4 w-4" />
                  切换到标准视图
                </>
              )}
            </Button>
          </motion.div>
        </div>

        <ScrollArea
          className={cn(
            "relative",
            orientation === "horizontal"
              ? "w-full max-w-[calc(100vw-2rem)]"
              : "h-auto max-h-[70vh]"
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              variants={{
                hidden: {
                  opacity: 0,
                  x: orientation === "horizontal" ? -20 : 0,
                  y: orientation === "vertical" ? -20 : 0,
                },
                visible: {
                  opacity: 1,
                  x: 0,
                  y: 0,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    staggerChildren: 0.05,
                  },
                },
              }}
              initial={animate ? "hidden" : false}
              animate="visible"
              className={cn(
                "flex gap-1.5 p-1",
                orientation === "horizontal" ? "flex-row" : "flex-col w-full",
                layout === "compact" && "gap-1"
              )}
            >
              <CategoryButton
                category={{
                  id: "all",
                  name: `全部应用${showCounts ? ` (${totalCount})` : ""}`,
                  icon: <LayoutGrid className="h-4 w-4" />,
                }}
                isSelected={!selectedCategories.length}
                onClick={() => onSelectCategory(null)}
                orientation={orientation}
                count={showCounts ? totalCount : undefined}
                layout={layout}
              />
              {categories.map((category) => (
                <CategoryButton
                  key={category.id}
                  category={category}
                  isSelected={selectedCategories.includes(category.id)}
                  onClick={() => handleCategoryClick(category.id)}
                  onRemove={() => handleRemoveCategory(category.id)}
                  orientation={orientation}
                  count={showCounts ? categoryCounts[category.id] : undefined}
                  layout={layout}
                  showRemoveButton={enableMultiSelect}
                />
              ))}
            </motion.div>
          </AnimatePresence>
          {orientation === "horizontal" && (
            <ScrollBar orientation="horizontal" />
          )}
        </ScrollArea>
      </div>
    );
  }
);

CategoryFilter.displayName = "CategoryFilter";
