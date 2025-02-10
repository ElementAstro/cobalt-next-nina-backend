"use client";

import { z } from "zod";
import { debounce } from "lodash";
import { useCalibrationStore } from "@/stores/guiding/calibrationStore";
import { motion } from "framer-motion";
import { Settings, Play, Pause, RefreshCw, Save, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";

// 扩展校准Schema以适配新参数
const calibrationSchema = z.object({
  lineLength: z.number().min(50).max(150),
  rotationSpeed: z.number().min(0).max(10),
  zoomLevel: z.number().min(0.5).max(2),
  exposure: z.number().min(0.1).max(10000),
  gain: z.number().min(0).max(100),
});

export default function CalibrationControls() {
  const { toast } = useToast();
  const {
    showGrid,
    setShowGrid,
    showAnimation,
    setShowAnimation,
    lineLength,
    setLineLength,
    handleRecalibrate,
    autoRotate,
    setAutoRotate,
    rotationSpeed,
    setRotationSpeed,
    zoomLevel,
    setZoomLevel,
    exposure,
    setExposure,
    gain,
    setGain,
    presets,
    currentPreset,
    applyPreset,
    saveAsPreset,
  } = useCalibrationStore();

  type CalibrationField = keyof typeof calibrationSchema.shape;

  const debouncedValidate = debounce(
    (value: number, field: CalibrationField) => {
      try {
        const schema = z.object({ [field]: calibrationSchema.shape[field] });
        schema.parse({ [field]: value });
      } catch (error) {
        if (error instanceof z.ZodError) {
          toast({
            variant: "destructive",
            title: "输入错误",
            description: error.errors[0].message,
          });
        }
      }
    },
    300
  );

  const handleValueChange = (
    value: number,
    field: CalibrationField,
    setter: (value: number) => void
  ) => {
    setter(value);
    debouncedValidate(value, field);
  };

  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetDescription, setNewPresetDescription] = useState("");
  const [showNewPresetDialog, setShowNewPresetDialog] = useState(false);

  const handleSaveNewPreset = () => {
    if (!newPresetName) {
      toast({
        variant: "destructive",
        title: "错误",
        description: "请输入预设名称",
      });
      return;
    }

    saveAsPreset(newPresetName, {
      name: newPresetName,
      description: newPresetDescription,
    });

    setShowNewPresetDialog(false);
    setNewPresetName("");
    setNewPresetDescription("");

    toast({
      title: "保存成功",
      description: "已成功保存新预设",
    });
  };

  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">基础设置</TabsTrigger>
          <TabsTrigger value="advanced">高级设置</TabsTrigger>
          <TabsTrigger value="presets">预设</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card className="border-gray-700 bg-gray-800/90">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="w-4 h-4" />
                基础控制
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* 基础控制项 */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>曝光时间 (ms)</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[exposure]}
                        onValueChange={(v) => setExposure(v[0])}
                        step={100}
                        min={100}
                        max={10000}
                        className="flex-1"
                      />
                      <span className="w-12 text-right text-sm">
                        {exposure}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>增益</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[gain]}
                        onValueChange={(v) => setGain(v[0])}
                        step={1}
                        min={0}
                        max={100}
                        className="flex-1"
                      />
                      <span className="w-12 text-right text-sm">{gain}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>网格显示</Label>
                    <Switch checked={showGrid} onCheckedChange={setShowGrid} />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>动画效果</Label>
                    <Switch
                      checked={showAnimation}
                      onCheckedChange={setShowAnimation}
                    />
                  </div>
                </div>

                {/* 高级控制项 */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>线条长度</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[lineLength]}
                        onValueChange={(v) =>
                          handleValueChange(v[0], "lineLength", setLineLength)
                        }
                        min={50}
                        max={150}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-12 text-right text-sm">
                        {lineLength}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>自动旋转</Label>
                    <Switch
                      checked={autoRotate}
                      onCheckedChange={setAutoRotate}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>旋转速度</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[rotationSpeed]}
                        onValueChange={(v) =>
                          handleValueChange(
                            v[0],
                            "rotationSpeed",
                            setRotationSpeed
                          )
                        }
                        min={0}
                        max={10}
                        step={0.1}
                        disabled={!autoRotate}
                        className="flex-1"
                      />
                      <span className="w-12 text-right text-sm">
                        {rotationSpeed}°/s
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>缩放级别</Label>
                    <div className="flex items-center gap-2">
                      <Slider
                        value={[zoomLevel]}
                        onValueChange={(v) =>
                          handleValueChange(v[0], "zoomLevel", setZoomLevel)
                        }
                        min={0.5}
                        max={2}
                        step={0.1}
                        className="flex-1"
                      />
                      <span className="w-12 text-right text-sm">
                        {zoomLevel}x
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <Button
                  onClick={handleRecalibrate}
                  variant="destructive"
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  重新校准
                </Button>
                <Button
                  onClick={() => setAutoRotate(!autoRotate)}
                  variant="outline"
                  className="w-full"
                >
                  {autoRotate ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      暂停
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      开始
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <div className="space-y-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">曝光时间</Label>
                <Slider
                  value={[exposure]}
                  onValueChange={(v) => setExposure(v[0])}
                  min={0.1}
                  max={10}
                  step={0.1}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">增益</Label>
                <Slider
                  value={[gain]}
                  onValueChange={(v) => setGain(v[0])}
                  min={1}
                  max={100}
                  step={1}
                />
              </div>
            </div>
            {/* ...more advanced settings... */}
          </div>
        </TabsContent>

        <TabsContent value="presets">
          <ScrollArea className="h-[400px] px-4">
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(presets).map(([key, preset]) => (
                <Card
                  key={key}
                  className={cn(
                    "cursor-pointer transition-colors hover:bg-gray-800/60",
                    currentPreset === key && "border-primary"
                  )}
                  onClick={() => applyPreset(key)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex justify-between">
                      {preset.name}
                      {currentPreset === key && (
                        <span className="text-xs text-primary">当前使用</span>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {preset.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>曝光: {preset.exposure}s</div>
                      <div>增益: {preset.gain}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Dialog
                open={showNewPresetDialog}
                onOpenChange={setShowNewPresetDialog}
              >
                <DialogTrigger asChild>
                  <Card className="cursor-pointer hover:bg-gray-800/60">
                    <CardHeader className="text-center py-8">
                      <Plus className="w-6 h-6 mx-auto mb-2" />
                      <CardTitle className="text-sm">创建新预设</CardTitle>
                    </CardHeader>
                  </Card>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>创建新预设</DialogTitle>
                    <DialogDescription>
                      保存当前的校准设置作为新的预设。
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="preset-name">预设名称</Label>
                      <Input
                        id="preset-name"
                        value={newPresetName}
                        onChange={(e) => setNewPresetName(e.target.value)}
                        placeholder="输入预设名称..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="preset-description">预设描述</Label>
                      <Input
                        id="preset-description"
                        value={newPresetDescription}
                        onChange={(e) =>
                          setNewPresetDescription(e.target.value)
                        }
                        placeholder="输入预设描述..."
                      />
                    </div>
                    <Button onClick={handleSaveNewPreset} className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      保存预设
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
