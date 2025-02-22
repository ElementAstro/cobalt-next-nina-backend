import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Maximize2, Grid, ZoomIn } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FOVInfoProps {
  getValues: (field: string) => number;
}

const InfoItem = ({ icon: Icon, label, value, unit }: {
  icon: React.ElementType;
  label: string;
  value: string;
  unit: string;
}) => (
  <motion.div
    className="flex-1"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Card className="bg-gray-900/90 border-gray-800 hover:border-gray-700 transition-colors">
            <CardContent className="p-4 flex flex-col items-center gap-2">
              <Icon className="w-4 h-4 text-sky-400" />
              <div className="text-center space-y-1">
                <p className="text-xs text-gray-400">{label}</p>
                <motion.div
                  className="text-sm font-medium text-gray-200"
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  {value} <span className="text-gray-500 text-xs">{unit}</span>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="text-xs">{label}：{value} {unit}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </motion.div>
);

const FOVInfo: React.FC<FOVInfoProps> = ({ getValues }) => {
  const x_pixels = getValues("x_pixels");
  const x_pixel_size = getValues("x_pixel_size");
  const y_pixels = getValues("y_pixels");
  const y_pixel_size = getValues("y_pixel_size");
  const focal_length = getValues("focal_length");

  const fovWidth = ((x_pixels * x_pixel_size * 206.265) / focal_length).toFixed(2);
  const fovHeight = ((y_pixels * y_pixel_size * 206.265) / focal_length).toFixed(2);
  const resolution = ((206.265 * x_pixel_size) / focal_length).toFixed(2);
  const samplingRate = ((x_pixel_size * 2) / focal_length).toFixed(2);

  return (
    <AnimatePresence>
      <motion.div 
        className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
      >
        <InfoItem
          icon={Maximize2}
          label="视场宽度"
          value={fovWidth}
          unit="′"
        />
        <InfoItem
          icon={Maximize2}
          label="视场高度"
          value={fovHeight}
          unit="′"
        />
        <InfoItem
          icon={Grid}
          label="分辨率"
          value={resolution}
          unit="″/px"
        />
        <InfoItem
          icon={ZoomIn}
          label="采样率"
          value={samplingRate}
          unit="″/px"
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default FOVInfo;
