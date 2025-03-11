"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSerialStore } from "@/stores/serial";
import { useEffect } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useSerialStore();

  useEffect(() => {
    // Apply theme on component mount and when theme changes
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <Button
      variant="outline"
      size="icon"
      className="h-8 w-8 bg-[#1a2b3d] border-[#2a3b4d] dark:bg-gray-800 dark:border-gray-700"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
