"use client";

import { useState, memo, useCallback, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Pin,
  Trash2,
  Edit2,
  Heart,
  Code,
  Settings,
  Wrench,
  Share,
  FolderPlus,
  Star,
  Zap,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// 动画变体配置
const animationVariants = {
  icon: {
    hover: {
      scale: 1.1,
      rotate: 5,
      transition: { 
        type: "spring", 
        stiffness: 400,
        damping: 10,
      },
    },
    tap: {
      scale: 0.95,
      rotate: -5,
      transition: {
        type: "spring",
        stiffness: 400,
      },
    },
    initial: {
      scale: 1,
      rotate: 0,
    },
  },
  card: {
    hover: {
      y: -5,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15,
      },
    },
  },
  button: {
    hover: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
    tap: {
      scale: 0.95,
    },
  },
};

interface App {
  id: string;
  name: string;
  icon: string;
  isPinned: boolean;
  category: string;
}

interface AppIconProps {
  id: string;
  name: string;
  icon: string;  
  isPinned: boolean;
  onPin: () => void;
  onLaunch: (app: App) => void;
  onDelete: () => void;
  onEdit: (newName: string) => void;
  className?: string;
  view: "grid" | "list";
  category: string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  isFavorite?: boolean;
  onFavorite?: () => void;
  size?: number;
  isCompact?: boolean;
  showStats?: boolean;
  onShare?: () => void;
  onAddToWorkspace?: () => void;
  stats?: {
    usageCount: number;
    lastUsed: Date;
  };
}

// 抽出编辑状态组件
const EditableInput = memo(({
  name,
  editedName,
  onSave,
  onChange,
  onCancel,
}: {
  name: string;
  editedName: string;
  onSave: () => void;
  onChange: (value: string) => void;
  onCancel: () => void;
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  return (
    <Input
      value={editedName}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onSave}
      onKeyDown={handleKeyDown}
      autoFocus
      className={cn(
        "text-sm text-center w-full",
        "focus:ring-2 focus:ring-primary",
        "transition-all duration-300",
        "bg-background/60 backdrop-blur-sm"
      )}
      aria-label={`编辑 ${name}`}
    />
  );
});

EditableInput.displayName = "EditableInput";

// 抽出图标组件
const AppIconImage = memo(({
  icon,
  name,
  isLoading,
  onLoad,
  onError,
  category,
  isPinned,
}: {
  icon: string;
  name: string;
  isLoading: boolean;
  onLoad: () => void;
  onError: () => void;
  category: string;
  isPinned: boolean;
}) => {
  const getCategoryIcon = () => {
    switch (category) {
      case "development":
        return <Code className="h-3.5 w-3.5 text-purple-500" />;
      case "system":
        return <Settings className="h-3.5 w-3.5 text-green-500" />;
      case "tools":
        return <Wrench className="h-3.5 w-3.5 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <motion.div variants={animationVariants.icon} className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-md">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      )}
      <div className="relative w-full h-full group-hover:scale-105 transition-transform">
        <Image
          src={icon}
          alt={name}
          fill
          className="object-contain rounded-md"
          onLoadingComplete={onLoad}
          onError={onError}
          loading="lazy"
          sizes="(max-width: 768px) 64px, 96px"
        />
        <div className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-background shadow-sm">
          {getCategoryIcon()}
        </div>
      </div>

      <AnimatePresence>
        {isPinned && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute -top-1 -right-1"
          >
            <Pin className="h-3.5 w-3.5 text-primary" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

AppIconImage.displayName = "AppIconImage";

// 主组件
export const AppIcon = memo(({
  id,
  name,
  icon,
  isPinned,
  onPin,
  onLaunch,
  onDelete,
  onEdit,
  className,
  view,
  category,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
  isFavorite = false,
  onFavorite,
  size = 96,
  isCompact = false,
  showStats = false,
  onShare,
  onAddToWorkspace,
  stats,
}: AppIconProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setEditedName(name);
  }, [name]);

  const handleSave = useCallback(() => {
    if (editedName.trim() !== name) {
      onEdit(editedName.trim());
    }
    setIsEditing(false);
  }, [editedName, name, onEdit]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditedName(name);
  }, [name]);

  // 使用 useMemo 缓存统计信息
  const statsDisplay = useMemo(() => {
    if (!showStats || !stats) return null;
    return (
      <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
        <Badge 
          variant="secondary" 
          className={cn(
            "h-5 px-1.5",
            "bg-primary/10 hover:bg-primary/20",
            "transition-colors duration-300"
          )}
        >
          <Zap className="mr-1 h-3 w-3" />
          {stats.usageCount}
        </Badge>
        <span className="hidden sm:inline">
          最后使用: {stats.lastUsed.toLocaleDateString()}
        </span>
      </div>
    );
  }, [showStats, stats]);

  const app: App = useMemo(() => ({
    id,
    name,
    icon,
    isPinned,
    category,
  }), [id, name, icon, isPinned, category]);

  return (
    <TooltipProvider>
      <ContextMenu>
        <ContextMenuTrigger>
          <Tooltip>
            <TooltipTrigger asChild>
              <motion.div
                initial="initial"
                whileHover="hover"
                whileTap="tap"
                variants={animationVariants.card}
                className={cn(
                  "relative group",
                  "transition-all duration-300",
                  "bg-background/60 backdrop-blur-sm",
                  "border border-primary/10",
                  "shadow-lg hover:shadow-xl",
                  isCompact ? "p-1.5" : "p-2",
                  view === "list" && "max-w-md",
                  isSelected && "ring-2 ring-primary ring-offset-2",
                  "rounded-xl hover:bg-accent/5"
                )}
                style={{
                  width: view === "list" ? "100%" : size,
                  height: view === "list" ? "auto" : size,
                }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                role="button"
                tabIndex={0}
                aria-label={`${name} 应用图标`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onLaunch(app);
                  }
                }}
              >
                {/* 选择模式复选框 */}
                {isSelectionMode && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute -right-2 -top-2 z-10"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onSelect?.(id)}
                      className="h-4 w-4 rounded-full border-2 border-primary bg-background"
                    />
                  </motion.div>
                )}
                
                {/* 收藏按钮 */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 15,
                        },
                      }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="absolute -top-2 -right-2 flex gap-1.5"
                    >
                      <motion.div variants={animationVariants.button}>
                        <Button
                          variant="secondary"
                          size="icon"
                          className={cn(
                            "h-8 w-8 rounded-full",
                            "bg-background/80 backdrop-blur-sm",
                            "shadow-lg hover:shadow-xl",
                            "transition-all duration-300"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            onFavorite?.();
                          }}
                        >
                          <Heart
                            className={cn(
                              "h-4 w-4 transition-colors",
                              isFavorite ? "text-red-500 fill-red-500" : "text-muted-foreground"
                            )}
                          />
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Button
                  variant="ghost"
                  className={cn(
                    "w-full h-auto flex items-center gap-2 p-2 rounded-lg",
                    "hover:bg-accent/5",
                    "transition-all duration-300",
                    view === "grid" ? "flex-col" : "flex-row justify-start",
                    className
                  )}
                  onClick={() => onLaunch(app)}
                >
                  <AppIconImage
                    icon={icon}
                    name={name}
                    isLoading={isLoading}
                    onLoad={() => setIsLoading(false)}
                    onError={() => setIsLoading(false)}
                    category={category}
                    isPinned={isPinned}
                  />

                  {isEditing ? (
                    <EditableInput
                      name={name}
                      editedName={editedName}
                      onSave={handleSave}
                      onChange={setEditedName}
                      onCancel={handleCancel}
                    />
                  ) : (
                    <span
                      className={cn(
                        "text-sm font-medium",
                        view === "grid"
                          ? "text-center line-clamp-2"
                          : "text-left truncate",
                        "group-hover:text-primary transition-colors"
                      )}
                    >
                      {name}
                    </span>
                  )}

                  {statsDisplay}
                </Button>
              </motion.div>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-background/80 backdrop-blur-sm px-3 py-1.5"
            >
              <p className="text-sm">{name}</p>
            </TooltipContent>
          </Tooltip>
        </ContextMenuTrigger>

        <ContextMenuContent 
          className={cn(
            "w-48",
            "bg-background/95 backdrop-blur-md",
            "border border-primary/10",
            "shadow-xl"
          )}
        >
          <ContextMenuItem
            className="flex items-center"
            onClick={() => onLaunch(app)}
          >
            <Zap className="mr-2 h-4 w-4" />
            <span>打开</span>
          </ContextMenuItem>
          
          <ContextMenuItem className="flex items-center" onClick={onPin}>
            <Pin className="mr-2 h-4 w-4" />
            <span>{isPinned ? "取消固定" : "固定到开始"}</span>
          </ContextMenuItem>

          <ContextMenuSeparator />
          
          <ContextMenuItem className="flex items-center" onClick={handleEdit}>
            <Edit2 className="mr-2 h-4 w-4" />
            <span>重命名</span>
          </ContextMenuItem>

          {onFavorite && (
            <ContextMenuItem
              className="flex items-center"
              onClick={() => onFavorite?.()}
            >
              <Star className="mr-2 h-4 w-4" />
              <span>{isFavorite ? "取消收藏" : "添加收藏"}</span>
            </ContextMenuItem>
          )}

          {onShare && (
            <ContextMenuItem className="flex items-center" onClick={onShare}>
              <Share className="mr-2 h-4 w-4" />
              <span>分享</span>
            </ContextMenuItem>
          )}

          {onAddToWorkspace && (
            <ContextMenuItem
              className="flex items-center"
              onClick={onAddToWorkspace}
            >
              <FolderPlus className="mr-2 h-4 w-4" />
              <span>添加到工作区</span>
            </ContextMenuItem>
          )}

          <ContextMenuSeparator />

          <ContextMenuItem
            className={cn(
              "flex items-center",
              "text-destructive focus:text-destructive",
              "hover:bg-destructive/10"
            )}
            onClick={onDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>删除</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </TooltipProvider>
  );
});

AppIcon.displayName = "AppIcon";
