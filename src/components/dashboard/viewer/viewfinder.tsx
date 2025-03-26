import { GridOverlay } from "./grid-overlay";
import { FocusPoint } from "./focus-point";
import { useMemo, useState, useRef } from "react";
import { useGesture } from "@use-gesture/react";
import { AnimatePresence, motion } from "framer-motion";
import { useHotkeys } from "react-hotkeys-hook";
import { Skeleton } from "@/components/ui/skeleton";

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
  gridType: "rule-of-thirds" | "golden-ratio" | "square" | "diagonal";
  onZoomChange: (zoom: number) => void;
  onRotationChange: (rotation: number) => void;
  colorTemperature: number;
  tint: number;
  isLoading?: boolean;
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
  isLoading = false,
}: ViewfinderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useHotkeys("ctrl+=", () => onZoomChange(Math.min(zoom + 0.1, 3)), {
    preventDefault: true,
  });
  useHotkeys("ctrl+-", () => onZoomChange(Math.max(zoom - 0.1, 0.5)), {
    preventDefault: true,
  });
  useHotkeys("r", () => onRotationChange((rotation + 90) % 360), {
    preventDefault: true,
  });

  const transformStyle = useMemo(
    () => ({
      transform: `scale(${zoom}) rotate(${rotation}deg)`,
      filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)
              opacity(${highlights}%) drop-shadow(0 0 ${shadows}px rgba(0,0,0,0.5))
              blur(${sharpness === 0 ? 0 : (100 - sharpness) * 0.1}px)
              sepia(${(Math.abs(colorTemperature - 6500) / 6500) * 50}%)
              hue-rotate(${tint * 0.5}deg)`,
      cursor: isDragging ? "grabbing" : "crosshair",
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
      isDragging,
    ]
  );

  const internalRef = useRef<HTMLDivElement>(null);
  const containerRef = viewfinderRef || internalRef;

  useGesture(
    {
      onPinch: ({ offset: [scale, angle] }) => {
        const newZoom = Math.min(Math.max(zoom * scale, 0.5), 3);
        onZoomChange(newZoom);
        onRotationChange((rotation + angle) % 360);
      },
      onDragStart: () => setIsDragging(true),
      onDragEnd: () => setIsDragging(false),
    },
    {
      target: containerRef,
      drag: {
        filterTaps: true,
        eventOptions: { passive: false }
      }
    }
  );

  return (
    <motion.div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-black"
      onClick={onClick}
      style={transformStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      aria-label="Camera viewfinder"
      role="region"
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : streamActive && currentImage ? (
          <motion.div
            key="image-preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: imageLoaded ? 1 : 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            <img
              src={currentImage}
              alt="Camera Preview"
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(false)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="no-stream"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-gray-900"
          >
            <span className="text-white/50">No video stream</span>
          </motion.div>
        )}
      </AnimatePresence>

      {showGrid && <GridOverlay type={gridType as "rule-of-thirds" | "golden-ratio" | "square" | "diagonal"} />}
      <FocusPoint x={focusPoint.x} y={focusPoint.y} />
    </motion.div>
  );
}
