import React, { useState, ReactNode } from "react";
import { useMediaQuery } from "react-responsive";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/swagger/settingsStore";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface ResponsiveLayoutProps {
  sidebar: ReactNode;
  content: ReactNode;
  className?: string;
}

export default function ResponsiveLayout({
  sidebar,
  content,
  className,
}: ResponsiveLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { layout } = useSettingsStore();
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const isTablet = useMediaQuery({
    query: "(max-width: 1024px) and (min-width: 769px)",
  });

  const getLayoutClasses = () => {
    if (isMobile) {
      return "block w-full";
    }

    switch (layout) {
      case "vertical":
        return "flex flex-col";
      case "horizontal":
        return "flex flex-row";
      case "compact":
        return "grid grid-cols-[300px_1fr]";
      default:
        return isTablet
          ? "grid grid-cols-[250px_1fr]"
          : "grid grid-cols-[300px_1fr]";
    }
  };

  const getContentClasses = () => {
    if (isMobile) {
      return "w-full";
    }

    switch (layout) {
      case "vertical":
        return "w-full";
      case "horizontal":
        return "flex-1 min-w-0";
      case "compact":
        return "overflow-auto";
      default:
        return "overflow-auto";
    }
  };

  const getSidebarClasses = () => {
    if (isMobile) {
      return "w-full";
    }

    switch (layout) {
      case "vertical":
        return "w-full";
      case "horizontal":
        return "w-[300px] flex-shrink-0 border-r overflow-auto h-[calc(100vh-4rem)]";
      case "compact":
        return "w-full border-r overflow-auto h-[calc(100vh-4rem)]";
      default:
        return isTablet
          ? "w-full border-r overflow-auto h-[calc(100vh-4rem)]"
          : "w-full border-r overflow-auto h-[calc(100vh-4rem)]";
    }
  };

  if (!isMobile) {
    return (
      <div className={cn(getLayoutClasses(), className)}>
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className={getSidebarClasses()}
        >
          {sidebar}
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={getContentClasses()}
        >
          {content}
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="sticky top-0 z-10 bg-background p-4 border-b flex items-center justify-between">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] sm:w-[350px] p-0">
            <SheetHeader className="p-4 bg-muted/50">
              <SheetTitle>API 导航</SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-auto p-4">{sidebar}</div>
          </SheetContent>
        </Sheet>
        <h2 className="text-lg font-semibold">API 文档</h2>
        <div className="w-9" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-2 sm:p-4"
      >
        {content}
      </motion.div>
    </div>
  );
}
