import { motion } from "framer-motion";
import { Settings, Save } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

interface Preset {
  name: string;
  settings: Record<string, number>;
}

interface SettingsPanelProps {
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  brightness: number;
  contrast: number;
  saturation: number;
  onBrightnessChange: (value: number) => void;
  onContrastChange: (value: number) => void;
  onSaturationChange: (value: number) => void;
  settingsRef: React.RefObject<HTMLDivElement>;
  exposure: number;
  highlights: number;
  shadows: number;
  sharpness: number;
  onExposureChange: (value: number) => void;
  onHighlightsChange: (value: number) => void;
  onShadowsChange: (value: number) => void;
  onSharpnessChange: (value: number) => void;
  histogramEnabled: boolean;
  onHistogramToggle: (enabled: boolean) => void;
  colorTemperature?: number;
  tint?: number;
  onColorTemperatureChange: (value: number) => void;
  onTintChange: (value: number) => void;
  onPresetSave?: (preset: Preset) => void;
  onPresetLoad?: (preset: Preset) => void;
}

export function SettingsPanel({
  showSettings,
  setShowSettings,
  brightness,
  contrast,
  saturation,
  onBrightnessChange,
  onContrastChange,
  onSaturationChange,
  settingsRef,
  exposure,
  highlights,
  shadows,
  sharpness,
  onExposureChange,
  onHighlightsChange,
  onShadowsChange,
  onSharpnessChange,
  histogramEnabled,
  onHistogramToggle,
  colorTemperature = 5500,
  tint = 0,
  onColorTemperatureChange,
  onTintChange,
  onPresetSave,
  onPresetLoad,
}: SettingsPanelProps) {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState("");

  const savePreset = (name: string) => {
    if (!name.trim()) return;

    const newPreset: Preset = {
      name,
      settings: {
        brightness,
        contrast,
        saturation,
        exposure,
        highlights,
        shadows,
        sharpness,
        colorTemperature,
        tint,
      },
    };
    setPresets([...presets, newPreset]);
    setPresetName("");
    onPresetSave?.(newPreset);
  };

  const loadPreset = (preset: Preset) => {
    const { settings } = preset;
    onBrightnessChange(settings.brightness);
    onContrastChange(settings.contrast);
    onSaturationChange(settings.saturation);
    onExposureChange(settings.exposure);
    onHighlightsChange(settings.highlights);
    onShadowsChange(settings.shadows);
    onSharpnessChange(settings.sharpness);
    onColorTemperatureChange(settings.colorTemperature);
    onTintChange(settings.tint);
    onPresetLoad?.(preset);
  };

  return (
    <Collapsible open={showSettings} onOpenChange={setShowSettings}>
      <div ref={settingsRef}>
        <CollapsibleTrigger className="absolute top-2 right-2 bg-gray-900/90 backdrop-blur-sm p-1.5 rounded-md">
          <Settings className="h-4 w-4" />
        </CollapsibleTrigger>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
              scale: {
                type: "spring",
                stiffness: 300,
                damping: 20,
              },
            }}
            className="absolute top-0 right-0 bg-black/50 backdrop-blur-sm p-4 space-y-4 w-80"
          >
            <CollapsibleContent>
              <Tabs defaultValue="basic">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="basic">基础</TabsTrigger>
                  <TabsTrigger value="advanced">高级</TabsTrigger>
                  <TabsTrigger value="tools">工具</TabsTrigger>
                </TabsList>

                <TabsContent value="basic">
                  <div className="space-y-2">
                    <Label
                      htmlFor="brightness"
                      className="text-sm font-medium text-white"
                    >
                      亮度
                    </Label>
                    <Slider
                      id="brightness"
                      min={0}
                      max={200}
                      step={1}
                      value={[brightness]}
                      onValueChange={([value]) => onBrightnessChange(value)}
                      className="w-48"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="contrast"
                      className="text-sm font-medium text-white"
                    >
                      对比度
                    </Label>
                    <Slider
                      id="contrast"
                      min={0}
                      max={200}
                      step={1}
                      value={[contrast]}
                      onValueChange={([value]) => onContrastChange(value)}
                      className="w-48"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="saturation"
                      className="text-sm font-medium text-white"
                    >
                      饱和度
                    </Label>
                    <Slider
                      id="saturation"
                      min={0}
                      max={200}
                      step={1}
                      value={[saturation]}
                      onValueChange={([value]) => onSaturationChange(value)}
                      className="w-48"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="advanced">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="exposure">曝光度</Label>
                      <Slider
                        id="exposure"
                        min={-100}
                        max={100}
                        value={[exposure]}
                        onValueChange={([value]) => onExposureChange(value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="highlights">高光</Label>
                      <Slider
                        id="highlights"
                        min={-100}
                        max={100}
                        value={[highlights]}
                        onValueChange={([value]) => onHighlightsChange(value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="shadows">阴影</Label>
                      <Slider
                        id="shadows"
                        min={-100}
                        max={100}
                        value={[shadows]}
                        onValueChange={([value]) => onShadowsChange(value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sharpness">锐化</Label>
                      <Slider
                        id="sharpness"
                        min={0}
                        max={100}
                        value={[sharpness]}
                        onValueChange={([value]) => onSharpnessChange(value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="temperature">色温</Label>
                      <Slider
                        id="temperature"
                        min={2000}
                        max={12000}
                        value={[colorTemperature]}
                        onValueChange={([value]) =>
                          onColorTemperatureChange(value)
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tint">色调</Label>
                      <Slider
                        id="tint"
                        min={-100}
                        max={100}
                        value={[tint]}
                        onValueChange={([value]) => onTintChange(value)}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tools">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="histogram">显示直方图</Label>
                      <Switch
                        id="histogram"
                        checked={histogramEnabled}
                        onCheckedChange={onHistogramToggle}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>预设管理</Label>
                      <div className="flex gap-2">
                        <Input
                          value={presetName}
                          onChange={(e) => setPresetName(e.target.value)}
                          placeholder="预设名称"
                          className="flex-1"
                        />
                        <Button
                          size="sm"
                          onClick={() => savePreset(presetName)}
                          disabled={!presetName.trim()}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          保存
                        </Button>
                      </div>

                      <ScrollArea className="h-40 mt-2">
                        {presets.map((preset) => (
                          <Button
                            key={preset.name}
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => loadPreset(preset)}
                          >
                            {preset.name}
                          </Button>
                        ))}
                      </ScrollArea>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CollapsibleContent>
          </motion.div>
        )}
      </div>
    </Collapsible>
  );
}
