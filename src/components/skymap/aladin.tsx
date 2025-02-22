"use client";

import React, { useEffect, useRef, useCallback, memo } from "react";
import Script from "next/script";
import { debounce } from "lodash";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, ZoomIn, ZoomOut, Camera, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AladinProps {
  ra: number;
  dec: number;
  fov: number;
  onCenterChange?: (ra: number, dec: number) => void;
  fov_points?: Array<[[number, number], [number, number], [number, number], [number, number]]>;
  fov_size?: number;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    A: any;
  }
}

const AladinComponent: React.FC<AladinProps> = ({
  ra,
  dec,
  fov,
  onCenterChange,
  fov_points,
  fov_size,
}) => {
  const alaRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const aladinInstance = useRef<any>(null);
  const isInitialized = useRef(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [quality, setQuality] = React.useState<"low" | "high">("low");

  const handleCenterChange = useCallback(
    (newRa: number, newDec: number) => {
      debounce(() => {
        onCenterChange?.(newRa, newDec);
      }, 100)();
    },
    [onCenterChange]
  );

  const initAladin = useCallback(() => {
    if (isInitialized.current) return;
    if (typeof window.A === "undefined") {
      console.error("AladinLite API not loaded");
      return;
    }

    aladinInstance.current = window.A.aladin(alaRef.current, {
      fov,
      projection: "AIT",
      cooFrame: "equatorial",
      showCooGridControl: true,
      showSimbadPointerControl: true,
      showCooGrid: true,
      survey: "P/DSS2/color",
      showProjectionControl: false,
      showZoomControl: false,
      showFullscreenControl: false,
      showLayersControl: false,
      showGotoControl: false,
      showFrame: false,
      cooframe: "equatorial",
      showSimbadPointrerControl: false,
      useWebGL2: true,
    });

    if (onCenterChange) {
      aladinInstance.current.on("zoomChanged", () => {
        const center = aladinInstance.current.getRaDec();
        handleCenterChange(center[0], center[1]);
      });

      aladinInstance.current.on("positionChanged", () => {
        const center = aladinInstance.current.getRaDec();
        handleCenterChange(center[0], center[1]);
      });
    }

    isInitialized.current = true;
    setIsLoading(false);
  }, [fov, onCenterChange, handleCenterChange]);

  useEffect(() => {
    return () => {
      isInitialized.current = false;
      if (aladinInstance.current) {
        aladinInstance.current.destroy?.();
        aladinInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!aladinInstance.current) return;

    const debouncedGoto = debounce(() => {
      aladinInstance.current.gotoRaDec(ra, dec);
    }, 100);

    debouncedGoto();
    return () => debouncedGoto.cancel();
  }, [ra, dec]);

  useEffect(() => {
    if (!aladinInstance.current || !fov_size) return;

    const debouncedSetFov = debounce(() => {
      aladinInstance.current.setFoV(fov_size);
    }, 100);

    debouncedSetFov();
    return () => debouncedSetFov.cancel();
  }, [fov_size]);

  useEffect(() => {
    if (!aladinInstance.current || !fov_points) return;

    aladinInstance.current.removeLayers();
    fov_points.forEach((points) => {
      if (typeof window.A !== "undefined") {
        aladinInstance.current.addFootprints(window.A.polygon(points));
      } else {
        console.error("AladinLite API not loaded");
      }
    });
  }, [fov_points]);

  const toggleQuality = () => {
    if (!aladinInstance.current) return;
    const newQuality = quality === "low" ? "high" : "low";
    aladinInstance.current.setImageQuality(newQuality);
    setQuality(newQuality);
    toast({
      title: "图像质量已更改",
      description: `已切换至${newQuality === "low" ? "低" : "高"}质量模式`,
    });
  };

  const handleZoomIn = () => {
    if (!aladinInstance.current) return;
    aladinInstance.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (!aladinInstance.current) return;
    aladinInstance.current.zoomOut();
  };

  const handleScreenshot = () => {
    if (!aladinInstance.current) return;
    const canvas = aladinInstance.current.exportAsPNG();
    const link = document.createElement("a");
    link.download = `skymap-${new Date().toISOString()}.png`;
    link.href = canvas;
    link.click();
    toast({
      title: "截图已保存",
      description: "天图截图已保存到下载文件夹",
    });
  };

  return (
    <>
      <Script
        src="https://aladin.cds.unistra.fr/AladinLite/api/v3/3.2.0/aladin.js"
        strategy="afterInteractive"
        onLoad={initAladin}
      />
      <Card className="relative overflow-hidden bg-gray-900/50 backdrop-blur-sm border-gray-800">
        <CardContent className="p-0">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative w-full h-[calc(100vh-6rem)]"
          >
            <div
              ref={alaRef}
              className="w-full h-full rounded-lg overflow-hidden"
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-sm text-gray-400">加载天图中...</p>
                </div>
              </div>
            )}
            <motion.div
              className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            />
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Badge variant="secondary" className="mb-2">
                {quality === "low" ? "低质量模式" : "高质量模式"}
              </Badge>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleQuality}
                className="bg-gray-800/50 hover:bg-gray-700/50 border-gray-700"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomIn}
                className="bg-gray-800/50 hover:bg-gray-700/50 border-gray-700"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleZoomOut}
                className="bg-gray-800/50 hover:bg-gray-700/50 border-gray-700"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleScreenshot}
                className="bg-gray-800/50 hover:bg-gray-700/50 border-gray-700"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="absolute bottom-4 left-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-2"
              >
                <Badge variant="outline" className="text-xs">
                  RA: {ra.toFixed(6)}°
                </Badge>
                <Badge variant="outline" className="text-xs">
                  DEC: {dec.toFixed(6)}°
                </Badge>
                <Badge variant="outline" className="text-xs">
                  FOV: {fov_size?.toFixed(2) || fov.toFixed(2)}°
                </Badge>
              </motion.div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </>
  );
};

const Aladin = memo(AladinComponent);

export default Aladin;