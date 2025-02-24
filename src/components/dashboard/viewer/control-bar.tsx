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
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-lg p-2 flex gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomOut}
        disabled={zoom <= 0.5}
        title="缩小 (-)"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomIn}
        disabled={zoom >= 3}
        title="放大 (+)"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>

      <Button variant="ghost" size="icon" onClick={onRotate} title="旋转 (R)">
        <RotateCw className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleGrid}
        className={showGrid ? "bg-muted" : ""}
        title="网格 (G)"
      >
        <Grid className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onCapture}
        disabled={isCapturing}
        title="拍摄 (空格)"
      >
        <Camera className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenLightBox}
        title="图片库"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSettings}
        className={showSettings ? "bg-muted" : ""}
        title="设置 (S)"
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
}
