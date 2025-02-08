"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { constructMapUrl } from "./static-map-utils";
import { Loader2, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDashboardStore, useViewerStore } from "@/stores/dashboardStore";

interface StaticMapProps {
  key: string;
  size?: string;
  scale?: number;
  markers?: string;
  labels?: string;
  paths?: string;
  traffic?: number;
  theme?: "normal" | "dark" | "light";
  features?: ("bg" | "road" | "building" | "point")[];
  opacity?: number;
  showControls?: boolean;
  showZoomButtons?: boolean;
  allowFullscreen?: boolean;
  showScale?: boolean;
  onMapClick?: (coordinates: string) => void;
}

export default function StaticMap({
  key,
  size = "400*300",
  scale = 1,
  markers,
  labels,
  paths,
  traffic = 0,
  theme = "normal",
  features = ["bg", "road", "building", "point"],
  opacity = 1,
  showControls = true,
  showZoomButtons = true,
  allowFullscreen = true,
  showScale = true,
  onMapClick,
}: StaticMapProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const startCoordinates = useRef({ x: 0, y: 0 });

  const { location, setLocation } = useDashboardStore();
  const { zoom, setZoom } = useViewerStore();

  // 添加触摸缩放所需的引用记录
  const initialTouchDistanceRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(zoom);

  const handleZoomIn = useCallback(
    () => setZoom(Math.min(zoom + 1, 17)),
    [zoom, setZoom]
  );
  const handleZoomOut = useCallback(
    () => setZoom(Math.max(zoom - 1, 1)),
    [zoom, setZoom]
  );

  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  const mapUrl = constructMapUrl({
    key: key,
    location: decodeURIComponent(
      location ? `${location.longitude},${location.latitude}` : ""
    ), // Keep location not encoded
    zoom: zoom,
    size: isLandscape ? "600*300" : size,
    scale,
    markers,
    labels,
    paths,
    traffic,
    style: `${theme}:${features.join(",")}`,
  });

  const [width, height] = (isLandscape ? "600*300" : size)
    .split("*")
    .map(Number);

  const handleMouseDown = (event: React.MouseEvent) => {
    setIsDragging(true);
    startCoordinates.current = { x: event.clientX, y: event.clientY };
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging || !location || !setLocation) return;

    const xDiff = startCoordinates.current.x - event.clientX;
    const yDiff = startCoordinates.current.y - event.clientY;

    const newLocation = {
      longitude: location.longitude + (xDiff * 0.01) / zoom,
      latitude: location.latitude + (yDiff * 0.01) / zoom,
    };

    setLocation(newLocation);
    startCoordinates.current = { x: event.clientX, y: event.clientY };
    if (onMapClick) {
      onMapClick(`${newLocation.longitude},${newLocation.latitude}`);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // 处理双指缩放
  const handleTouchStart = (event: React.TouchEvent) => {
    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      initialTouchDistanceRef.current = distance;
      initialZoomRef.current = zoom;
    }
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    if (
      event.touches.length === 2 &&
      initialTouchDistanceRef.current !== null
    ) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      const factor = currentDistance / initialTouchDistanceRef.current;
      // 根据缩放因子计算新的 zoom，并四舍五入
      const newZoom = Math.round(initialZoomRef.current * factor);
      // 限制 zoom 的取值范围
      const clampedZoom = Math.max(1, Math.min(newZoom, 17));
      setZoom(clampedZoom);
    }
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (event.touches.length < 2) {
      initialTouchDistanceRef.current = null;
    }
  };

  return (
    <motion.div
      className={`relative ${fullscreen ? "fixed inset-0 z-50 bg-black" : ""} ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      style={{ opacity }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {showControls && (
        <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
          {showZoomButtons && (
            <div className="flex flex-col gap-1">
              <Button size="sm" variant="secondary" onClick={handleZoomIn}>
                +
              </Button>
              <Button size="sm" variant="secondary" onClick={handleZoomOut}>
                -
              </Button>
            </div>
          )}
          {allowFullscreen && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setFullscreen(!fullscreen)}
            >
              {fullscreen ? <Minimize2 /> : <Maximize2 />}
            </Button>
          )}
        </div>
      )}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </motion.div>
        )}
      </AnimatePresence>
      <div>
        <Image
          src={mapUrl}
          alt="Static Map"
          width={width}
          height={height}
          className={`w-full h-auto ${
            isLoading ? "opacity-0" : "opacity-100"
          } transition-opacity duration-200`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
        />
      </div>
      {hasError && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          地图加载失败
        </motion.div>
      )}
      {showScale && scale && (
        <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 text-xs rounded">
          {Math.round((width * scale) / 100)}m
        </div>
      )}
      {fullscreen && (
        <Dialog open={fullscreen} onOpenChange={setFullscreen}>
          <DialogContent className="w-full h-full p-0">
            <DialogHeader>
              <DialogTitle>地图全屏视图</DialogTitle>
            </DialogHeader>
            <div className="w-full h-full">
              <Image
                src={mapUrl}
                alt="Fullscreen Map"
                width={width * 2}
                height={height * 2}
                className={`w-full h-auto ${
                  isLoading ? "opacity-0" : "opacity-100"
                } transition-opacity duration-200`}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setHasError(true);
                  setIsLoading(false);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}
