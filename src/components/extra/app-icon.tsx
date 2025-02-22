"use client";

import { useState } from "react";
import {
  Pin,
  Trash2,
  Edit2,
  Heart,
  ImageIcon,
  Code,
  Settings,
  Wrench,
  Share,
  FolderPlus,
  Star,
  Zap,
  LayoutGrid,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
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
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

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
  container: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
        staggerChildren: 0.1,
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

export function AppIcon({
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
}: AppIconProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [isHovered, setIsHovered] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    if (editedName.trim() !== "") {
      onEdit(editedName);
      setIsEditing(false);
    }
  };

  const getCategoryIcon = () => {
    switch (category) {
      case "development":
        return <Code className="h-3.5 w-3.5 text-purple-500" />;
      case "media":
        return <ImageIcon className="h-3.5 w-3.5 text-pink-500" />;
      case "system":
        return <Settings className="h-3.5 w-3.5 text-green-500" />;
      case "tools":
        return <Wrench className="h-3.5 w-3.5 text-yellow-500" />;
      default:
        return null;
    }
  };

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
                  "relative group transition-all duration-200",
                  isCompact ? "p-1.5" : "p-2",
                  view === "list" && "max-w-md",
                  isSelected && "ring-2 ring-primary ring-offset-2 dark:ring-offset-background",
                  "rounded-lg hover:bg-accent/5 dark:hover:bg-accent/10"
                )}
                style={{
                  width: view === "list" ? "100%" : size,
                  height: view === "list" ? "auto" : size,
                }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
              >
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
                          className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-lg"
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
                    "hover:bg-accent/5 dark:hover:bg-accent/10",
                    "transition-all duration-200",
                    view === "grid" ? "flex-col" : "flex-row justify-start",
                    className
                  )}
                  onClick={() => onLaunch({ id, name, icon, isPinned, category })}
                >
                  <motion.div
                    variants={animationVariants.icon}
                    className={cn(
                      "relative",
                      view === "grid" ? "w-12 h-12" : "w-8 h-8"
                    )}
                  >
                    <div className="relative w-full h-full group-hover:scale-105 transition-transform">
                      <Image
                        src={icon}
                        alt={name}
                        fill
                        className="object-contain rounded-md"
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

                  {isEditing ? (
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onBlur={handleSave}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSave();
                        }
                      }}
                      autoFocus
                      className={cn(
                        "text-sm text-center w-full",
                        "focus:ring-2 focus:ring-primary",
                        "transition-all duration-200"
                      )}
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

                  {showStats && stats && view === "list" && (
                    <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="h-5 px-1.5">
                        <Zap className="mr-1 h-3 w-3" />
                        {stats.usageCount}
                      </Badge>
                      <span className="hidden sm:inline">
                        最后使用: {stats.lastUsed.toLocaleDateString()}
                      </span>
                    </div>
                  )}
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

        <ContextMenuContent className="w-48">
          <ContextMenuItem
            className="flex items-center"
            onClick={() => onLaunch({ id, name, icon, isPinned, category })}
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

          {showStats && stats && (
            <ContextMenuItem className="flex items-center cursor-default">
              <Settings className="mr-2 h-4 w-4" />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">
                  使用次数: {stats.usageCount}
                </span>
                <span className="text-xs text-muted-foreground">
                  最后使用: {stats.lastUsed.toLocaleDateString()}
                </span>
              </div>
            </ContextMenuItem>
          )}

          {(onShare || onAddToWorkspace) && <ContextMenuSeparator />}

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
            className="flex items-center text-destructive focus:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>删除</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </TooltipProvider>
  );
}
