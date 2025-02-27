import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  message?: string;
  retryAction?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  center?: boolean;
}

export function ErrorState({
  message = "加载失败，请重试",
  retryAction,
  className,
  size = "md",
  center = true,
}: ErrorStateProps) {
  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div
      className={cn(
        "space-y-2",
        center && "flex flex-col items-center justify-center text-center",
        className
      )}
    >
      <AlertCircle
        className={cn(sizeMap[size], "text-destructive mx-auto mb-1")}
      />
      <p
        className={cn(
          "text-muted-foreground",
          size === "sm" ? "text-xs" : "text-sm"
        )}
      >
        {message}
      </p>
      {retryAction && (
        <Button
          variant="outline"
          size="sm"
          onClick={retryAction}
          className={cn("mt-2", size === "sm" ? "h-7 text-xs" : "")}
        >
          重试
        </Button>
      )}
    </div>
  );
}
