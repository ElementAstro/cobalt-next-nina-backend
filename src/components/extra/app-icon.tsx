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
} from "lucide-react";

const animationVariants = {
  icon: {
    hover: {
      scale: 1.1,
      rotate: 5,
      transition: { type: "spring", stiffness: 400 },
    },
    tap: {
      scale: 0.95,
      rotate: -5,
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
      },
    },
  },
  container: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
};
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

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
    onEdit(editedName);
    setIsEditing(false);
  };

  return (
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
                isSelected && "ring-1 ring-primary ring-offset-1"
              )}
              style={{
                width: view === "list" ? "100%" : size,
                height: view === "list" ? "auto" : size,
              }}
              onHoverStart={() => setIsHovered(true)}
              onHoverEnd={() => setIsHovered(false)}
            >
              {isSelectionMode && (
                <div
                  className="absolute -right-2 -top-2 z-10 rounded-full bg-background border-2 border-border p-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect?.(id);
                  }}
                >
                  <Checkbox checked={isSelected} />
                </div>
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
                    exit={{
                      opacity: 0,
                      scale: 0.8,
                      transition: {
                        duration: 0.2,
                      },
                    }}
                    className="absolute -top-2 -right-2 flex gap-1"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFavorite?.();
                      }}
                    >
                      {isFavorite ? (
                        <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                      ) : (
                        <Heart className="h-4 w-4" />
                      )}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
              <Button
                variant="ghost"
                className={cn(
                  "w-full h-auto flex items-center gap-2 p-2 rounded-lg hover:bg-accent group transition-all duration-200",
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
                  whileHover={{ rotate: 5 }}
                >
                  <div className="relative w-full h-full">
                    <Image
                      src={icon}
                      alt={name}
                      fill
                      className="object-contain"
                    />
                    {category === "development" && (
                      <Code className="absolute bottom-0 right-0 w-3 h-3 text-primary" />
                    )}
                    {category === "media" && (
                      <ImageIcon className="absolute bottom-0 right-0 w-3 h-3 text-primary" />
                    )}
                    {category === "system" && (
                      <Settings className="absolute bottom-0 right-0 w-3 h-3 text-primary" />
                    )}
                    {category === "tools" && (
                      <Wrench className="absolute bottom-0 right-0 w-3 h-3 text-primary" />
                    )}
                  </div>
                  {isPinned && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                    >
                      <Pin className="absolute -top-1 -right-1 w-3 h-3 text-primary" />
                    </motion.div>
                  )}
                </motion.div>
                {isEditing ? (
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onBlur={handleSave}
                    autoFocus
                    className="text-sm text-center w-full"
                  />
                ) : (
                  <span
                    className={cn(
                      "text-sm",
                      view === "grid"
                        ? "text-center line-clamp-2"
                        : "text-left truncate"
                    )}
                  >
                    {name}
                  </span>
                )}
              </Button>
            </motion.div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{name}</p>
          </TooltipContent>
        </Tooltip>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => onLaunch({ id, name, icon, isPinned, category })}
        >
          打开
        </ContextMenuItem>
        <ContextMenuItem onClick={onPin}>
          {isPinned ? "取消固定" : "固定到开始"}
        </ContextMenuItem>
        <ContextMenuItem onClick={handleEdit}>
          <Edit2 className="mr-2 h-4 w-4" />
          重命名
        </ContextMenuItem>
        <ContextMenuItem onClick={onDelete} className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          删除
        </ContextMenuItem>
        {showStats && stats && (
          <ContextMenuItem>
            使用次数: {stats.usageCount}
            <br />
            最后使用: {stats.lastUsed.toLocaleDateString()}
          </ContextMenuItem>
        )}
        {onShare && (
          <ContextMenuItem onClick={onShare}>
            <Share className="mr-2 h-4 w-4" />
            分享
          </ContextMenuItem>
        )}
        {onAddToWorkspace && (
          <ContextMenuItem onClick={onAddToWorkspace}>
            <FolderPlus className="mr-2 h-4 w-4" />
            添加到工作区
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
