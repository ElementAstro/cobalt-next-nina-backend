"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; 
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, memo, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { Settings2, Thermometer, Camera, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DarkFieldStore } from "@/types/guiding/darkfield";
import { useMediaQuery } from "react-responsive";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Props = Pick<
  DarkFieldStore,
  | "isoValue"
  | "setIsoValue"
  | "binningMode"
  | "setBinningMode"
  | "coolingEnabled" 
  | "setCoolingEnabled"
  | "targetTemperature"
  | "setTargetTemperature"
  | "gainValue"
  | "setGainValue" 
  | "offsetValue"
  | "setOffsetValue"
  | "validateSettings"
> & {
  isLoading: boolean;
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

const contentVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const AdvancedOptions = memo(({ ...props }: Props) => {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const isPortrait = useMediaQuery({ query: "(orientation: portrait)" });

  const [currentTemp, setCurrentTemp] = useState(props.targetTemperature);
  const [stabilized, setStabilized] = useState(false);

  useEffect(() => {
    if (props.coolingEnabled) {
      const interval = setInterval(() => {
        const simulatedTemp = currentTemp + (props.targetTemperature - currentTemp) * 0.1;
        setCurrentTemp(simulatedTemp);
        setStabilized(Math.abs(simulatedTemp - props.targetTemperature) < 0.5);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [props.coolingEnabled, props.targetTemperature, currentTemp]);

  const validateTemperature = useCallback((temp: number) => {
    if (temp < -20 || temp > 0) {
      toast({
        title: "温度设置错误",
        description: "目标温度必须在-20°C到0°C之间",
        variant: "destructive",
      });
      return false;
    }
    if (temp > -5) {
      toast({
        title: "温度警告",
        description: "建议将温度设置在-5°C以下以获得更好的效果",
        variant: "destructive",
      });
    }
    return true;
  }, []);

  const handleTemperatureChange = (value: number) => {
    if (validateTemperature(value)) {
      props.setTargetTemperature(value);
    }
  };

  return (
    <TooltipProvider>
      <motion.div 
        className={cn(
          "space-y-4",
          isPortrait && "max-w-md mx-auto"
        )}
        variants={contentVariants}
        initial="hidden"
        animate="visible"
      >
        <div className={cn(
          "grid gap-4",
          isPortrait ? "grid-cols-1" : "grid-cols-2"
        )}>
          <motion.div variants={cardVariants}>
            <Card className="bg-card/50 backdrop-blur border-primary/10 shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className={cn("pb-2", isMobile && "p-4")}>
                <CardTitle className={cn(
                  "text-lg flex items-center gap-2",
                  isMobile && "text-base"
                )}>
                  <Camera className="h-4 w-4 text-blue-400" />
                  相机控制
                  {stabilized && props.coolingEnabled && (
                    <Badge 
                      variant="secondary" 
                      className="ml-auto text-xs bg-green-500/10 text-green-500"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                      温度已稳定
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className={cn("space-y-4", isMobile && "p-4")}>
                <AnimatePresence mode="wait">
                  <motion.div 
                    className="grid gap-4"
                    variants={contentVariants}
                  >
                    <motion.div
                      className="space-y-2"
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Label className={cn("text-sm flex items-center gap-2", isMobile && "text-xs")}>
                        ISO 值
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Sparkles className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>调整相机感光度,值越大噪点越多</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Slider
                        className={cn("mt-2", isMobile && "h-4")}
                        min={100}
                        max={3200}
                        step={100}
                        value={[props.isoValue]}
                        onValueChange={(value) => props.setIsoValue(value[0])}
                        disabled={props.isLoading}
                      />
                      <p className={cn(
                        "text-sm text-muted-foreground",
                        isMobile && "text-xs"
                      )}>
                        {props.isoValue}
                      </p>
                    </motion.div>

                    <motion.div 
                      className="space-y-2"
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Label className="flex items-center gap-2">
                        Binning 模式
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Sparkles className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>像素合并模式,可以提高信噪比</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Select
                        value={props.binningMode}
                        onValueChange={(value) => {
                          props.setBinningMode(value);
                          toast({
                            title: "Binning 模式已更新",
                            description: `当前模式: ${value}`,
                          });
                        }}
                        disabled={props.isLoading}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["1x1", "2x2", "3x3", "4x4"].map((mode) => (
                            <SelectItem key={mode} value={mode}>
                              {mode}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>

                    <motion.div 
                      className="flex items-center gap-4"
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Switch
                        id="cooling"
                        checked={props.coolingEnabled}
                        onCheckedChange={(checked) => {
                          props.setCoolingEnabled(checked);
                          if (!checked) {
                            toast({
                              title: "制冷已关闭",
                              description: "相机温度将逐渐回升",
                            });
                          }
                        }}
                        disabled={props.isLoading}
                        className="data-[state=checked]:bg-green-500"
                      />
                      <Label htmlFor="cooling" className="flex items-center gap-2">
                        启用制冷
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Sparkles className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>开启相机制冷系统降低暗电流噪声</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                    </motion.div>

                    <AnimatePresence>
                      {props.coolingEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-2"
                        >
                          <Label className="flex items-center gap-2">
                            目标温度 (°C)
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Sparkles className="h-3 w-3 text-muted-foreground cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>设置期望达到的传感器温度</p>
                              </TooltipContent>
                            </Tooltip>
                          </Label>
                          <Slider
                            min={-20}
                            max={0}
                            step={1}
                            value={[props.targetTemperature]}
                            onValueChange={(value) => handleTemperatureChange(value[0])}
                            disabled={props.isLoading}
                            className="data-[state=active]:bg-blue-500"
                          />
                          <p className="text-sm text-muted-foreground">
                            {props.targetTemperature}°C
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {["增益值", "偏移值"].map((label, index) => (
                      <motion.div
                        key={label}
                        className="space-y-2"
                        whileHover={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Label className="flex items-center gap-2">
                          {label}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Sparkles className="h-3 w-3 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {index === 0 
                                  ? "调整传感器信号放大倍数" 
                                  : "调整传感器基准电平"
                                }
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </Label>
                        <Slider
                          min={0}
                          max={100}
                          step={1}
                          value={[index === 0 ? props.gainValue : props.offsetValue]}
                          onValueChange={(value) => 
                            index === 0 
                              ? props.setGainValue(value[0])
                              : props.setOffsetValue(value[0])
                          }
                          disabled={props.isLoading}
                          className={cn(
                            "data-[state=active]:bg-blue-500",
                            props.isLoading && "opacity-50"
                          )}
                        />
                        <p className="text-sm text-muted-foreground">
                          {index === 0 ? props.gainValue : props.offsetValue}
                        </p>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className={cn(
              "bg-card/50 backdrop-blur border-primary/10 shadow-lg hover:shadow-xl transition-shadow duration-300",
              isPortrait && "mt-4"
            )}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-purple-400" />
                  处理选项
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <motion.div className="space-y-4" variants={contentVariants}>
                  <motion.div 
                    className="space-y-2"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Label className="flex items-center gap-2">
                      暗场校正方法
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Sparkles className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>选择不同的暗场帧合成算法</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Select defaultValue="kappa-sigma">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="average">均值</SelectItem>
                        <SelectItem value="median">中值</SelectItem>
                        <SelectItem value="kappa-sigma">Kappa-Sigma</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>

                  {["噪声降低强度", "热像素检测阈值"].map((label, index) => (
                    <motion.div
                      key={label}
                      className="space-y-2"
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Label className="flex items-center gap-2">
                        {label}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Sparkles className="h-3 w-3 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {index === 0
                                ? "调整降噪算法的强度"
                                : "设置检测热像素的灵敏度"
                              }
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        defaultValue={[index === 0 ? 50 : 30]}
                        disabled={props.isLoading}
                        className={cn(
                          "data-[state=active]:bg-purple-500",
                          props.isLoading && "opacity-50"
                        )}
                      />
                    </motion.div>
                  ))}

                  <motion.div 
                    className="flex items-center gap-4"
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Switch
                      id="autoOptimize"
                      defaultChecked={true}
                      disabled={props.isLoading}
                      onCheckedChange={(checked) =>
                        toast({
                          title: checked ? "自动优化已启用" : "自动优化已禁用",
                          variant: checked ? "default" : "destructive",
                        })
                      }
                      className="data-[state=checked]:bg-purple-500"
                    />
                    <Label htmlFor="autoOptimize" className="flex items-center gap-2">
                      自动优化处理参数
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Sparkles className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>自动根据图像质量调整参数</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                  </motion.div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div variants={cardVariants}>
          <Card className={cn(
            "bg-card/50 backdrop-blur border-primary/10 shadow-lg hover:shadow-xl transition-shadow duration-300",
            isPortrait && "mt-4"
          )}>
            <CardHeader className={cn("pb-2", isMobile && "p-4")}>
              <CardTitle className={cn(
                "text-lg flex items-center gap-2",
                isMobile && "text-base"
              )}>
                <Thermometer className="h-4 w-4 text-red-400" />
                温度控制
              </CardTitle>
              <CardDescription className={cn("text-sm", isMobile && "text-xs")}>
                当前温度: {currentTemp.toFixed(1)}°C
                {props.coolingEnabled && ` (目标: ${props.targetTemperature}°C)`}
              </CardDescription>
            </CardHeader>
            <CardContent className={cn("space-y-2", isMobile && "p-4")}>
              <motion.div 
                className="space-y-2"
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <Label className="flex items-center gap-2">
                  目标温度 (°C)
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Sparkles className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>设置期望达到的传感器温度</p>
                    </TooltipContent>
                  </Tooltip>
                </Label>
                <Slider
                  min={-20}
                  max={0}
                  step={1}
                  value={[props.targetTemperature]}
                  onValueChange={(value) => handleTemperatureChange(value[0])}
                  disabled={props.isLoading}
                  className="data-[state=active]:bg-red-500"
                />
                <p className="text-sm text-muted-foreground">
                  {props.targetTemperature}°C
                </p>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>

        <style jsx global>{`
          @media (max-width: 768px) {
            .slider-track {
              height: 6px;
            }
            .slider-thumb {
              width: 20px;
              height: 20px;
            }
            .switch {
              transform: scale(0.9);
            }
          }
        `}</style>
      </motion.div>
    </TooltipProvider>
  );
});

AdvancedOptions.displayName = "AdvancedOptions";
export default AdvancedOptions;
