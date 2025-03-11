import { Box } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
  className?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title = "无可用数据",
  message = "目前没有可显示的数据",
  icon,
  className,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "flex flex-col items-center justify-center text-center p-6",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
        {icon || <Box className="h-6 w-6 text-muted-foreground" />}
      </div>

      <h3 className="text-base font-medium mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs">{message}</p>

      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
