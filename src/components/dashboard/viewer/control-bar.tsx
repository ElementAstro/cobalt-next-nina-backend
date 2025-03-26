import { Button } from "@/components/ui/button";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Grid,
  Camera,
  Image as ImageIcon,
  Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useHotkeys } from "react-hotkeys-hook";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ControlBarProps {
  zoom: number;
  isCapturing: boolean;
  showGrid: boolean;
  showSettings: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
  onToggleGrid: () => void;
  onCapture: () => void;
  onOpenLightBox: () => void;
  onToggleSettings: () => void;
}

const ControlButton = ({
  children,
  onClick,
  disabled = false,
  tooltip,
  hotkey,
  active = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tooltip: string;
  hotkey?: string;
  active?: boolean;
}) => {
  useHotkeys(
    hotkey || "",
    (e) => {
      e.preventDefault();
      onClick();
    },
    { enabled: !!hotkey && !disabled }
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          whileHover={{ scale: disabled ? 1 : 1.1 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className={`relative ${active ? "bg-muted" : ""}`}
            aria-label={tooltip}
          >
            {children}
            {active && (
              <motion.span
                className="absolute inset-0 rounded-full bg-current opacity-10"
                layoutId="activeIndicator"
              />
            )}
          </Button>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="flex items-center gap-1">
          <span>{tooltip}</span>
          {hotkey && (
            <span className="text-xs opacity-70">({hotkey.toUpperCase()})</span>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export function ControlBar({
  zoom,
  isCapturing,
  showGrid,
  showSettings,
  onZoomIn,
  onZoomOut,
  onRotate,
  onToggleGrid,
  onCapture,
  onOpenLightBox,
  onToggleSettings,
}: ControlBarProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-lg p-2 flex gap-2 shadow-lg"
    >
      <ControlButton
        onClick={onZoomOut}
        disabled={zoom <= 0.5}
        tooltip="缩小"
        hotkey="-"
        active={false}
      >
        <ZoomIn className="h-4 w-4" />
      </ControlButton>

      <ControlButton
        onClick={onZoomIn}
        disabled={zoom >= 3}
        tooltip="放大"
        hotkey="="
        active={false}
      >
        <ZoomOut className="h-4 w-4" />
      </ControlButton>

      <ControlButton
        onClick={onRotate}
        tooltip="旋转"
        hotkey="r"
        active={false}
      >
        <RotateCw className="h-4 w-4" />
      </ControlButton>

      <ControlButton
        onClick={onToggleGrid}
        tooltip="网格"
        hotkey="g"
        active={showGrid}
      >
        <Grid className="h-4 w-4" />
      </ControlButton>

      <ControlButton
        onClick={onCapture}
        disabled={isCapturing}
        tooltip="拍摄"
        hotkey="space"
        active={false}
      >
        <AnimatePresence mode="wait">
          {isCapturing ? (
            <motion.div
              key="capturing"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="h-3 w-3 rounded-full bg-red-500"
            />
          ) : (
            <motion.div
              key="camera"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
            >
              <Camera className="h-4 w-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </ControlButton>

      <ControlButton
        onClick={onOpenLightBox}
        tooltip="图片库"
        active={false}
      >
        <ImageIcon className="h-4 w-4" />
      </ControlButton>

      <ControlButton
        onClick={onToggleSettings}
        tooltip="设置"
        hotkey="s"
        active={showSettings}
      >
        <Settings className="h-4 w-4" />
      </ControlButton>
    </motion.div>
  );
}
