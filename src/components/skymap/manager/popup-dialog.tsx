import React, { FC } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AlertCircle,
  Info,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PopupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  popupText: string;
  setPopupText: (text: string) => void;
  type?: "info" | "success" | "warning" | "error";
  autoClose?: number;
}

const PopupDialog: FC<PopupDialogProps> = ({
  open,
  onOpenChange,
  popupText,
  type = "info",
  autoClose = 0,
}) => {
  // 自动关闭
  React.useEffect(() => {
    if (open && autoClose > 0) {
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [open, autoClose, onOpenChange]);

  // 获取图标和颜色
  const getIconAndColor = () => {
    switch (type) {
      case "success":
        return {
          icon: CheckCircle2,
          color: "text-green-400",
          bgColor: "bg-green-500/10",
          borderColor: "border-green-500/20",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          color: "text-yellow-400",
          bgColor: "bg-yellow-500/10",
          borderColor: "border-yellow-500/20",
        };
      case "error":
        return {
          icon: AlertCircle,
          color: "text-red-400",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/20",
        };
      default:
        return {
          icon: Info,
          color: "text-blue-400",
          bgColor: "bg-blue-500/10",
          borderColor: "border-blue-500/20",
        };
    }
  };

  const { icon: Icon, color, bgColor, borderColor } = getIconAndColor();

  const dialogVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        duration: 0.4,
        bounce: 0.3,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2,
      },
    },
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent asChild>
        <motion.div
          variants={dialogVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "relative overflow-hidden",
            "bg-gray-900/95 backdrop-blur-md border shadow-xl",
            "p-6 rounded-lg",
            borderColor
          )}
        >
          {/* 背景装饰 */}
          <div
            className={cn(
              "absolute top-0 left-0 w-full h-1",
              "bg-gradient-to-r",
              type === "success" && "from-green-500/50 to-green-500/10",
              type === "warning" && "from-yellow-500/50 to-yellow-500/10",
              type === "error" && "from-red-500/50 to-red-500/10",
              type === "info" && "from-blue-500/50 to-blue-500/10"
            )}
          />

          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="flex items-center gap-2">
              <motion.div
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Icon className={cn("w-5 h-5", color)} />
              </motion.div>
              <span className={color}>
                {type === "success" && "成功"}
                {type === "warning" && "警告"}
                {type === "error" && "错误"}
                {type === "info" && "提示"}
              </span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              <div className={cn("p-3 rounded", bgColor)}>
                {popupText}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4">
            <AlertDialogAction
              className={cn(
                "transition-all duration-200",
                type === "success" && "bg-green-600 hover:bg-green-500",
                type === "warning" && "bg-yellow-600 hover:bg-yellow-500",
                type === "error" && "bg-red-600 hover:bg-red-500",
                type === "info" && "bg-blue-600 hover:bg-blue-500"
              )}
              onClick={() => onOpenChange(false)}
            >
              确定
            </AlertDialogAction>
          </AlertDialogFooter>

          {autoClose > 0 && (
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: autoClose / 1000, ease: "linear" }}
              className={cn(
                "absolute bottom-0 left-0 h-0.5",
                type === "success" && "bg-green-400",
                type === "warning" && "bg-yellow-400",
                type === "error" && "bg-red-400",
                type === "info" && "bg-blue-400"
              )}
              style={{ transformOrigin: "left" }}
            />
          )}
        </motion.div>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PopupDialog;