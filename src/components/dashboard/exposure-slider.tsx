import React, { useRef, useState, useCallback, useMemo } from "react";
import { debounce } from "lodash";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCameraStore } from "@/stores/cameraStore";
import { Timer, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HistoryItem {
  exposure: number;
  timestamp: Date;
}

const MAX_HISTORY = 50; // 限制历史记录数量
const PRESET_VALUES = [0.001, 0.01, 0.1, 1, 10, 30, 60, 300, 600, 1800, 3600];

export function ExposureTimeSlider() {
  const { exposure, exposureMin, exposureMax, setExposure } = useCameraStore();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastExposureRef = useRef(exposure);

  // 使用 useMemo 缓存预设值
  const presetValues = useMemo(() => PRESET_VALUES, []);

  // 防抖处理历史记录添加
  const debouncedAddToHistory = useCallback(
    debounce((newExposure: number) => {
      if (newExposure === lastExposureRef.current) return;

      const newHistoryItem = {
        exposure: newExposure,
        timestamp: new Date(),
      };

      setHistory((prev) => {
        const newHistory = [
          ...prev.slice(0, historyIndex + 1),
          newHistoryItem,
        ].slice(-MAX_HISTORY);
        return newHistory;
      });

      setHistoryIndex((prev) => Math.min(prev + 1, MAX_HISTORY - 1));
      lastExposureRef.current = newExposure;
    }, 300),
    [historyIndex]
  );

  const handleExposureChange = useCallback(
    (value: number) => {
      setExposure(value);
      debouncedAddToHistory(value);
    },
    [setExposure, debouncedAddToHistory]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setExposure(prevState.exposure);
      setHistoryIndex((prev) => prev - 1);
    }
  }, [history, historyIndex, setExposure]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setExposure(nextState.exposure);
      setHistoryIndex((prev) => prev + 1);
    }
  }, [history, historyIndex, setExposure]);

  const handlePresetClick = useCallback(
    (value: number) => {
      handleExposureChange(value);
    },
    [handleExposureChange]
  );

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          ref={containerRef}
          className="bg-gray-900 border-gray-800 transition-shadow hover:shadow-lg"
        >
          <CardHeader className="pb-2">
            <motion.div
              className="flex items-center justify-between"
              layoutId="header"
            >
              <CardTitle className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                <motion.div
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <Timer className="w-5 h-5" />
                </motion.div>
                <span>Exposure</span>
              </CardTitle>
              {/* Placeholder for future modes if needed */}
            </motion.div>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <AnimatePresence mode="wait">
              <motion.div
                key="exposure"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Exposure Controls */}
                <div className="grid grid-cols-[auto_1fr_auto] gap-4 items-center mb-4">
                  <Label className="w-24 text-gray-300">Exposure Time</Label>
                  <motion.div whileTap={{ scale: 0.98 }}>
                    <Slider
                      value={[exposure]}
                      onValueChange={(values) =>
                        handleExposureChange(values[0])
                      }
                      max={exposureMax}
                      min={exposureMin}
                      step={0.1}
                      className="flex-1"
                    />
                  </motion.div>
                  <div className="flex items-center gap-2">
                    <motion.div whileHover={{ scale: 1.02 }}>
                      <Input
                        type="number"
                        value={exposure}
                        onChange={(e) =>
                          handleExposureChange(Number(e.target.value))
                        }
                        min={exposureMin}
                        max={exposureMax}
                        step={0.1}
                        className="w-20 h-8 bg-gray-800 border-gray-700 transition-colors focus:border-blue-500"
                      />
                    </motion.div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 bg-gray-800 border-gray-700 transition-colors hover:bg-gray-700"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 grid grid-cols-4 gap-1 p-2 bg-gray-800 border-gray-700">
                        {presetValues.map((value) => (
                          <Tooltip key={value}>
                            <TooltipTrigger asChild>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  onClick={() => handlePresetClick(value)}
                                  variant="outline"
                                  size="sm"
                                  className="text-xs w-full bg-gray-700 text-gray-200 hover:bg-gray-600 border-gray-600"
                                >
                                  {value}s
                                </Button>
                              </motion.div>
                            </TooltipTrigger>
                            <TooltipContent>Set to {value}s</TooltipContent>
                          </Tooltip>
                        ))}
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                {/* Undo/Redo Controls */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                  >
                    Undo
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                  >
                    Redo
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}
