import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { FOVPreset, PresetGroup } from "@/types/skymap/fov";

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>预设组管理</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {presetGroups.map((group) => (
            <div key={group.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">{group.name}</h3>
                {group.id !== "default" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPresetGroups((prev) =>
                        prev.filter((g) => g.id !== group.id)
                      );
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-2">
                {group.presets.map((preset, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 bg-gray-700 rounded"
                  >
                    <span>{preset.name}</span>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => applyPreset(preset)}
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
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button
            className="w-full"
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
