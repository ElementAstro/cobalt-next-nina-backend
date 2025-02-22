import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { FOVPreset, PresetGroup } from "@/types/skymap/fov";
import { motion, AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface AddPresetProps {
  presetGroups: PresetGroup[];
  setPresetGroups: React.Dispatch<React.SetStateAction<PresetGroup[]>>;
  applyPreset: (preset: FOVPreset) => void;
}

export const AddPreset: React.FC<AddPresetProps> = ({
  presetGroups,
  setPresetGroups,
  applyPreset,
}) => {
  return (
    <Dialog>
      <DialogContent className="max-w-2xl max-h-[90vh] bg-gray-900/95 backdrop-blur-sm border border-gray-800">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold bg-gradient-to-r from-sky-400 to-blue-600 bg-clip-text text-transparent">
            预设组管理
          </DialogTitle>
          <Alert className="bg-yellow-900/20 border-yellow-600/50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-xs text-yellow-200">
              删除预设组操作无法撤销，请谨慎操作。
            </AlertDescription>
          </Alert>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence mode="popLayout">
              {presetGroups.map((group) => (
                <motion.div
                  key={group.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-gray-200">
                        {group.name}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {group.presets.length} 个预设
                      </Badge>
                    </div>
                    {group.id !== "default" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setPresetGroups((prev) =>
                            prev.filter((g) => g.id !== group.id)
                          );
                        }}
                        className="h-8 px-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <AnimatePresence mode="popLayout">
                      {group.presets.map((preset, idx) => (
                        <motion.div
                          key={idx}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 hover:border-gray-600/50 transition-colors"
                        >
                          <span className="text-sm text-gray-300">
                            {preset.name}
                          </span>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => applyPreset(preset)}
                              className="h-8 px-3 hover:bg-blue-900/20 hover:text-blue-400"
                            >
                              应用
                            </Button>
                            {group.id !== "default" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setPresetGroups((prev) =>
                                    prev.map((g) =>
                                      g.id === group.id
                                        ? {
                                            ...g,
                                            presets: g.presets.filter(
                                              (_, i) => i !== idx
                                            ),
                                          }
                                        : g
                                    )
                                  );
                                }}
                                className="h-8 px-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </ScrollArea>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white shadow-lg"
            onClick={() => {
              const newGroup: PresetGroup = {
                id: crypto.randomUUID(),
                name: `新预设组 ${presetGroups.length}`,
                presets: [],
              };
              setPresetGroups((prev) => [...prev, newGroup]);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            添加预设组
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};
