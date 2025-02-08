import { FOVPreset } from "@/types/skymap/fov";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Trash2, Save, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.3,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        <DialogContent className="max-w-2xl bg-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              管理预设
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">系统预设</h4>
                <div className="flex flex-col gap-2">
                  {commonPresets
                    .concat(additionalPresets)
                    .map((preset: FOVPreset) => (
                      <div
                        key={preset.name}
                        className="flex items-center justify-between p-2 bg-gray-700 rounded"
                      >
                        <span className="text-sm">{preset.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => applyPreset(preset)}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium">自定义预设</h4>
                <div className="flex flex-col gap-2">
                  {customPresets.map((preset, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-700 rounded"
                    >
                      <span className="text-sm">{preset.name}</span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => applyPreset(preset)}
                        >
                          <Star className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCustomPresets((prev) =>
                              prev.filter((_, i) => i !== index)
                            );
                            toast({
                              title: "删除成功",
                              description: `预设 ${preset.name} 已删除`,
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button
              className="w-full"
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
          </div>
        </DialogContent>
      </motion.div>
    </Dialog>
  );
};
