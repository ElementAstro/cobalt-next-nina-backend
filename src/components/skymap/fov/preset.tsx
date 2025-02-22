import { FOVPreset } from "@/types/skymap/fov";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Trash2, Save, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// 为系统预设添加默认值
const commonPresets: FOVPreset[] = [
  {
    name: "预设 1",
    x_pixels: 1024,
    y_pixels: 768,
    x_pixel_size: 1.0,
    y_pixel_size: 1.0,
    focal_length: 50,
  },
  {
    name: "预设 2",
    x_pixels: 1920,
    y_pixels: 1080,
    x_pixel_size: 1.2,
    y_pixel_size: 1.2,
    focal_length: 35,
  },
];
const additionalPresets: FOVPreset[] = []; // 预留额外预设

interface PresetManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applyPreset: (preset: FOVPreset) => void;
  customPresets: FOVPreset[];
  setCustomPresets: React.Dispatch<React.SetStateAction<FOVPreset[]>>;
  getValues: () => {
    x_pixels: number;
    y_pixels: number;
    x_pixel_size: number;
    y_pixel_size: number;
    focal_length: number;
  };
}

const PresetCard: React.FC<{
  preset: FOVPreset;
  onApply: () => void;
  onDelete?: () => void;
  isSystem?: boolean;
}> = ({ preset, onApply, onDelete, isSystem }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    whileHover={{ scale: 1.02 }}
    className="group"
  >
    <Card className="bg-gray-900/90 border-gray-800 hover:border-gray-700 transition-colors">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-gray-200">
              {preset.name}
            </CardTitle>
            {isSystem && (
              <Badge variant="secondary" className="text-xs">
                系统
              </Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-xs text-gray-400">
          {preset.x_pixels} × {preset.y_pixels} 像素
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {preset.focal_length}mm f/{(preset.focal_length / Math.sqrt(preset.x_pixel_size * preset.y_pixel_size)).toFixed(1)}
          </div>
          <div className="flex gap-2">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={onApply}
                className="h-8 px-3 bg-blue-900/20 hover:bg-blue-900/40 text-blue-400"
              >
                <Star className="w-4 h-4 mr-1" />
                应用
              </Button>
            </motion.div>
            {onDelete && (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="h-8 px-2 hover:bg-red-900/20 text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export const PresetManager: React.FC<PresetManagerProps> = ({
  open,
  onOpenChange,
  applyPreset,
  customPresets,
  setCustomPresets,
  getValues,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] bg-gray-900/95 backdrop-blur-sm border-gray-800">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold bg-gradient-to-r from-sky-400 to-blue-600 bg-clip-text text-transparent">
            <Settings className="w-5 h-5" />
            预设管理器
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* 系统预设 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-200">系统预设</h3>
                <Badge variant="secondary" className="text-xs">
                  {commonPresets.length + additionalPresets.length} 个预设
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <AnimatePresence mode="popLayout">
                  {commonPresets.concat(additionalPresets).map((preset) => (
                    <PresetCard
                      key={preset.name}
                      preset={preset}
                      onApply={() => applyPreset(preset)}
                      isSystem
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>

            <Separator className="bg-gray-800" />

            {/* 自定义预设 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-200">自定义预设</h3>
                <Badge variant="secondary" className="text-xs">
                  {customPresets.length} 个预设
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <AnimatePresence mode="popLayout">
                  {customPresets.map((preset, index) => (
                    <PresetCard
                      key={index}
                      preset={preset}
                      onApply={() => applyPreset(preset)}
                      onDelete={() => {
                        setCustomPresets((prev) =>
                          prev.filter((_, i) => i !== index)
                        );
                        toast({
                          title: "删除成功",
                          description: `预设 ${preset.name} 已删除`,
                        });
                      }}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </ScrollArea>

        <motion.div
          className="pt-4"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white shadow-lg"
            onClick={() => {
              const currentValues = getValues();
              const newPreset: FOVPreset = {
                name: `自定义预设 ${customPresets.length + 1}`,
                x_pixels: currentValues.x_pixels,
                y_pixels: currentValues.y_pixels,
                x_pixel_size: currentValues.x_pixel_size,
                y_pixel_size: currentValues.y_pixel_size,
                focal_length: currentValues.focal_length,
              };
              setCustomPresets((prev) => [...prev, newPreset]);
              toast({
                title: "保存成功",
                description: `已保存为自定义预设`,
              });
            }}
          >
            <Save className="w-4 h-4 mr-2" />
            保存当前设置为自定义预设
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
