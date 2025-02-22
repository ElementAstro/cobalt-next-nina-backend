import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Grid, Crosshair, ZoomIn } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PreviewControlsProps {
  showGridlines: boolean;
  setShowGridlines: React.Dispatch<React.SetStateAction<boolean>>;
  showCrosshair: boolean;
  setShowCrosshair: React.Dispatch<React.SetStateAction<boolean>>;
  previewZoom: number;
  setPreviewZoom: React.Dispatch<React.SetStateAction<number>>;
}

export const PreviewControls: React.FC<PreviewControlsProps> = ({
  showGridlines,
  setShowGridlines,
  showCrosshair,
  setShowCrosshair,
  previewZoom,
  setPreviewZoom,
}) => {
  return (
    <Card className="mt-4 bg-gray-900/95 border-gray-800">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 space-y-4">
            <motion.div
              className="flex items-center justify-between space-x-4"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <div className="flex items-center space-x-2">
                <Grid className="w-4 h-4 text-sky-400" />
                <Label htmlFor="grid-lines" className="text-sm text-gray-300">
                  网格线
                </Label>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Switch
                      id="grid-lines"
                      checked={showGridlines}
                      onCheckedChange={setShowGridlines}
                      className="data-[state=checked]:bg-sky-600"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">显示或隐藏网格线</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>

            <motion.div
              className="flex items-center justify-between space-x-4"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <div className="flex items-center space-x-2">
                <Crosshair className="w-4 h-4 text-sky-400" />
                <Label htmlFor="crosshair" className="text-sm text-gray-300">
                  十字准线
                </Label>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Switch
                      id="crosshair"
                      checked={showCrosshair}
                      onCheckedChange={setShowCrosshair}
                      className="data-[state=checked]:bg-sky-600"
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">显示或隐藏十字准线</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </motion.div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-2">
              <ZoomIn className="w-4 h-4 text-sky-400" />
              <Label className="text-sm text-gray-300">缩放控制</Label>
            </div>
            <div className="flex items-center space-x-4">
              <Slider
                value={[previewZoom]}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={(value) => setPreviewZoom(value[0])}
                className="flex-1"
              />
              <motion.span 
                className="text-xs text-gray-400 min-w-[60px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                key={previewZoom}
              >
                {previewZoom.toFixed(1)}x
              </motion.span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
