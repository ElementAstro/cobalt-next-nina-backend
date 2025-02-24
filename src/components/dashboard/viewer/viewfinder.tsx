import { GridOverlay } from "./grid-overlay";
import { FocusPoint } from "./focus-point";
import { useMemo, useEffect } from "react";
import { useGesture } from "@use-gesture/react";
import { AnimatePresence, motion } from "framer-motion";

interface ViewfinderProps {
  viewfinderRef: React.RefObject<HTMLDivElement>;
  zoom: number;
  rotation: number;
  brightness: number;
  contrast: number;
  saturation: number;
  showGrid: boolean;
  streamActive: boolean;
  currentImage: string | null;
  focusPoint: { x: number; y: number };
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  highlights: number;
  shadows: number;
  sharpness: number;
  gridType: string;
  onZoomChange: (zoom: number) => void;
  onRotationChange: (rotation: number) => void;
  colorTemperature: number;
  tint: number;
}

export function Viewfinder({
  viewfinderRef,
  zoom,
  rotation,
  brightness,
  contrast,
  saturation,
  showGrid,
  streamActive,
  currentImage,
  focusPoint,
  onClick,
  highlights,
  shadows,
  sharpness,
  gridType,
  onZoomChange,
  onRotationChange,
  colorTemperature,
  tint,
}: ViewfinderProps) {
  const transformStyle = useMemo(
    () => ({
      transform: `scale(${zoom}) rotate(${rotation}deg)`,
      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) 
              opacity(${highlights}%) drop-shadow(0 0 ${shadows}px rgba(0,0,0,0.5)) 
              blur(${sharpness === 0 ? 0 : (100 - sharpness) * 0.1}px)
              sepia(${(Math.abs(colorTemperature - 6500) / 6500) * 50}%)
              hue-rotate(${tint * 0.5}deg)`,
    }),
    [
      zoom,
      rotation,
      brightness,
      contrast,
      saturation,
      highlights,
      shadows,
      sharpness,
      colorTemperature,
      tint,
    ]
  );

  const bind = useGesture({
    onPinch: ({ offset: [scale, angle] }: { offset: [number, number] }) => {
      const newZoom = Math.min(Math.max(zoom * scale, 0.5), 3);
      onZoomChange(newZoom);
      onRotationChange((rotation + angle) % 360);
    },
  });

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Equal" && e.ctrlKey)
        onZoomChange(Math.min(zoom + 0.1, 3));
      if (e.code === "Minus" && e.ctrlKey)
        onZoomChange(Math.max(zoom - 0.1, 0.5));
      if (e.code === "KeyR") onRotationChange((rotation + 90) % 360);
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [zoom, rotation, onZoomChange, onRotationChange]);

  return (
    <div
      {...bind()}
      ref={viewfinderRef}
      className="relative flex-1 overflow-hidden bg-black cursor-crosshair"
      onClick={onClick}
      style={transformStyle}
    >
      <AnimatePresence mode="wait">
        {streamActive && currentImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <img
              src={currentImage}
              alt="Camera Preview"
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {showGrid && <GridOverlay type={gridType} />}
      <FocusPoint x={focusPoint.x} y={focusPoint.y} />
    </div>
  );
}
