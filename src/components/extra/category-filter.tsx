"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImageIcon, Settings, Wrench, Code, Briefcase, MessageCircle, Shield } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

interface CategoryFilterProps {
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  orientation?: "horizontal" | "vertical";
}

export function CategoryFilter({
  selectedCategory,
  onSelectCategory,
  orientation = "horizontal",
}: CategoryFilterProps) {
  const categories = [
    { id: "microsoft", name: "微软应用", icon: <ImageIcon className="h-4 w-4" /> },
    { id: "system", name: "系统工具", icon: <Settings className="h-4 w-4" /> },
    { id: "tools", name: "常用工具", icon: <Wrench className="h-4 w-4" /> },
    { id: "development", name: "开发工具", icon: <Code className="h-4 w-4" /> },
    { id: "media", name: "媒体工具", icon: <ImageIcon className="h-4 w-4" /> },
    { id: "productivity", name: "效率工具", icon: <Briefcase className="h-4 w-4" /> },
    { id: "communication", name: "通讯工具", icon: <MessageCircle className="h-4 w-4" /> },
    { id: "security", name: "安全工具", icon: <Shield className="h-4 w-4" /> }
  ];

  const [layout, setLayout] = useState<"compact" | "normal">("normal");

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLayout(l => l === "normal" ? "compact" : "normal")}
        >
          {layout === "normal" ? "紧凑视图" : "标准视图"}
        </Button>
      </div>
      <ScrollArea
        className={cn(
          orientation === "horizontal" ? "max-w-full" : "h-auto max-h-[70vh]"
        )}
      >
        <div
          className={cn(
            "flex gap-1.5",
            orientation === "horizontal"
              ? "flex-row"
              : "flex-col w-full px-1.5 py-2",
            layout === "compact" && "space-y-1"
          )}
        >
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            onClick={() => onSelectCategory(null)}
            className={cn(
              "whitespace-nowrap flex items-center gap-2",
              orientation === "vertical" && "w-full justify-start"
            )}
            size="sm"
          >
            全部应用
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => onSelectCategory(category.id)}
              className={cn(
                "whitespace-nowrap flex items-center gap-2",
                orientation === "vertical" && "w-full justify-start"
              )}
              size="sm"
            >
              {category.icon}
              {category.name}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
