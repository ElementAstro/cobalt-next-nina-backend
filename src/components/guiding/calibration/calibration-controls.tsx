"use client";

import { z } from "zod";
import { debounce } from "lodash";
import { useCalibrationStore } from "@/stores/guiding/calibrationStore";
import { motion } from "framer-motion";
import { 
  Settings,
  Play,
  Pause,
  RefreshCw,
  Save,
  Plus,
  ChevronRight,
  Info
} from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

// 校准参数验证Schema
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

  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetDescription, setNewPresetDescription] = useState("");
  const [showNewPresetDialog, setShowNewPresetDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  const debouncedValidate = debounce(
    (value: number, field: keyof typeof calibrationSchema.shape) => {
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
    field: keyof typeof calibrationSchema.shape,
    setter: (value: number) => void
  ) => {
    setter(value);
    debouncedValidate(value, field);
  };

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
      exposure,
      gain,
      lineLength,
      rotationSpeed,
      showGrid,
      showAnimation,
      autoRotate,
      zoomLevel,
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
      <Alert className="mb-4 bg-blue-900/20 border-blue-800">
        <Info className="h-4 w-4 text-blue-400" />
        <AlertTitle>提示</AlertTitle>
        <AlertDescription className="text-sm text-gray-300">
          在进行校准之前，请确保相机和赤道仪已经正确连接并初始化。
        </AlertDescription>
      </Alert>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 bg-gray-800/50 backdrop-blur-sm">
          <TabsTrigger
            value="basic"
            className="data-[state=active]:bg-gray-700/50"
          >
            基础设置
          </TabsTrigger>
          <TabsTrigger
            value="advanced"
            className="data-[state=active]:bg-gray-700/50"
          >
            高级设置
          </TabsTrigger>
          <TabsTrigger
            value="presets"
            className="data-[state=active]:bg-gray-700/50"
          >
            预设管理
          </TabsTrigger>
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
              <div className="grid gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>曝光时间 (ms)</Label>
                      <Badge variant="outline" className="font-mono">
                        {exposure}
                      </Badge>
                    </div>
                    <Slider
                      value={[exposure]}
                      onValueChange={([value]) =>
                        handleValueChange(value, "exposure", setExposure)
                      }
                      min={100}
                      max={10000}
                      step={100}
                      className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>增益</Label>
                      <Badge variant="outline" className="font-mono">
                        {gain}
                      </Badge>
                    </div>
                    <Slider
                      value={[gain]}
                      onValueChange={([value]) =>
                        handleValueChange(value, "gain", setGain)
                      }
                      min={0}
                      max={100}
                      step={1}
                      className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label>参考网格</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>显示校准用的参考网格</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Switch
                      checked={showGrid}
                      onCheckedChange={setShowGrid}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label>动画效果</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>启用平滑动画效果</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Switch
                      checked={showAnimation}
                      onCheckedChange={setShowAnimation}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label>自动旋转</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>启用自动旋转模式</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Switch
                      checked={autoRotate}
                      onCheckedChange={setAutoRotate}
                    />
                  </div>

                  {autoRotate && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Label>旋转速度</Label>
                        <Badge variant="outline" className="font-mono">
                          {rotationSpeed}°/s
                        </Badge>
                      </div>
                      <Slider
                        value={[rotationSpeed]}
                        onValueChange={([value]) =>
                          handleValueChange(value, "rotationSpeed", setRotationSpeed)
                        }
                        min={0}
                        max={10}
                        step={0.1}
                        className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                      />
                    </motion.div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleRecalibrate}
                          variant="destructive"
                          className="w-full group"
                        >
                          <RefreshCw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                          重新校准
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>重新开始校准过程</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={autoRotate ? "destructive" : "default"}
                          onClick={() => setAutoRotate(!autoRotate)}
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
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{autoRotate ? "暂停自动校准" : "开始自动校准"}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced">
          <Card className="border-gray-700 bg-gray-800/90">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="w-4 h-4" />
                高级设置
              </CardTitle>
              <CardDescription>
                这些设置影响校准的精确度和性能
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>线条长度</Label>
                    <Badge variant="outline" className="font-mono">
                      {lineLength}px
                    </Badge>
                  </div>
                  <Slider
                    value={[lineLength]}
                    onValueChange={([value]) =>
                      handleValueChange(value, "lineLength", setLineLength)
                    }
                    min={50}
                    max={150}
                    step={1}
                    className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>缩放等级</Label>
                    <Badge variant="outline" className="font-mono">
                      {zoomLevel}x
                    </Badge>
                  </div>
                  <Slider
                    value={[zoomLevel]}
                    onValueChange={([value]) =>
                      handleValueChange(value, "zoomLevel", setZoomLevel)
                    }
                    min={0.5}
                    max={2}
                    step={0.1}
                    className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presets">
          <Card className="border-gray-700 bg-gray-800/90">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">预设管理</CardTitle>
                <Dialog open={showNewPresetDialog} onOpenChange={setShowNewPresetDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      新建预设
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>创建新预设</DialogTitle>
                      <DialogDescription>
                        保存当前的校准设置为新的预设配置。
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
                          onChange={(e) => setNewPresetDescription(e.target.value)}
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
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {Object.entries(presets).map(([key, preset]) => (
                    <Card
                      key={key}
                      className={cn(
                        "cursor-pointer transition-all hover:bg-gray-700/50",
                        currentPreset === key &&
                          "border-primary bg-primary/5"
                      )}
                      onClick={() => applyPreset(key)}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-sm">
                              {preset.name}
                            </CardTitle>
                            {currentPreset === key && (
                              <Badge variant="default" className="text-xs">
                                当前使用
                              </Badge>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        </div>
                        <CardDescription className="text-xs mt-1">
                          {preset.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
