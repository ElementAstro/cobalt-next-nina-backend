import { toast } from "@/hooks/use-toast";
import {
  additionalPresets,
  commonPresets,
  FovDataType,
  FOVPreset,
  PresetGroup,
  schema,
} from "@/types/skymap/fov";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Calculator,
  Camera,
  Download,
  HelpCircle,
  Settings,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import FOVInfo from "./fov-info";
import { FocalLengthCalculator } from "./focal";
import { PreviewControls } from "./preview";
import { PresetManager } from "./preset";
import { AddPreset } from "./add-preset";
import { useSkymapStore } from "@/stores/skymap/skymapStore";

interface FOVDialogProps {
  open_dialog: boolean;
}

export const FOVSettingDialog: React.FC<FOVDialogProps> = ({ open_dialog }) => {
  const {
    viewState,
    setViewState,
    calculateFovPoints
  } = useSkymapStore();

  const {
    register,
    handleSubmit,
    control,
    reset,
    getValues,
    formState: { errors },
  } = useForm<FovDataType & { rotation: number }>({
    resolver: zodResolver(schema),
    defaultValues: {
      x_pixels: viewState.fovData.xPixels,
      x_pixel_size: viewState.fovData.xPixelSize,
      y_pixels: viewState.fovData.yPixels, 
      y_pixel_size: viewState.fovData.yPixelSize,
      focal_length: viewState.fovData.focalLength,
      rotation: viewState.cameraRotation
    },
  });
  const [aperture, setAperture] = useState<number>(0);
  const [fRatio, setFRatio] = useState<number>(0);
  const [showPresetManager, setShowPresetManager] = useState(false);
  const [customPresets, setCustomPresets] = useState<FOVPreset[]>([]);

  // 在 FOVSettingDialog 组件内新增状态
  const [presetGroups, setPresetGroups] = useState<PresetGroup[]>([
    {
      id: "default",
      name: "默认组",
      presets: commonPresets,
    },
    {
      id: "custom",
      name: "自定义",
      presets: [],
    },
  ]);

  const [showGridlines, setShowGridlines] = useState(true);
  const [showCrosshair, setShowCrosshair] = useState(true);
  const [previewZoom, setPreviewZoom] = useState(1);

  useEffect(() => {
    setViewState({ showFovDialog: open_dialog });
  }, [open_dialog, setViewState]);

  useEffect(() => {
    reset({
      x_pixels: viewState.fovData.xPixels,
      x_pixel_size: viewState.fovData.xPixelSize,
      y_pixels: viewState.fovData.yPixels,
      y_pixel_size: viewState.fovData.yPixelSize, 
      focal_length: viewState.fovData.focalLength,
      rotation: viewState.cameraRotation
    });
  }, [viewState.fovData, viewState.cameraRotation, reset]);

  const applyPreset = useCallback(
    (preset: FOVPreset) => {
      reset({
        x_pixels: preset.x_pixels,
        y_pixels: preset.y_pixels,
        x_pixel_size: preset.x_pixel_size,
        y_pixel_size: preset.y_pixel_size,
        focal_length: preset.focal_length,
        rotation: viewState.cameraRotation
      });
      toast({
        title: "预设应用",
        description: `${preset.name} 已应用。`,
      });
    },
    [reset, viewState.cameraRotation]
  );

  const exportData = useCallback(() => {
    const data = { ...getValues() };
    const csvContent = `data:text/csv;charset=utf-8,${Object.keys(data).join(
      ","
    )}\n${Object.values(data).join(",")}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "fov_settings.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [getValues]);

  const onSubmit = useCallback(
    (data: FovDataType & { rotation: number }) => {
      setViewState({
        fovData: {
          xPixels: data.x_pixels,
          xPixelSize: data.x_pixel_size,
          yPixels: data.y_pixels,
          yPixelSize: data.y_pixel_size,
          focalLength: data.focal_length
        },
        cameraRotation: data.rotation
      });
      
      calculateFovPoints();
      
      toast({
        title: "保存成功",
        description: "视场设置已更新。",
      });
      
      setViewState({ showFovDialog: false });
    },
    [setViewState, calculateFovPoints]
  );

  // 添加帮助提示组件
  const HelpTooltip: React.FC<{ content: string }> = ({ content }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <HelpCircle className="w-4 h-4 text-gray-400" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <Dialog open={viewState.showFovDialog} onOpenChange={(open) => setViewState({ showFovDialog: open })}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.4,
          ease: [0.16, 1, 0.3, 1],
          scale: {
            type: "spring",
            stiffness: 260,
            damping: 20,
          },
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto p-3 bg-gray-800 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3"
          >
            {/* Mobile overlay */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[-1]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm">
                <Calculator className="w-4 h-4 text-yellow-400" />
                视场设置
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="w-3 h-3 cursor-pointer" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        设置相机的视场参数，包括像素数、像素大小和焦距。
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </DialogTitle>
            </DialogHeader>

            <div className="flex flex-col landscape:flex-row landscape:space-x-3">
              {/* 左侧：设置表单 */}
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="flex-1 space-y-3 landscape:space-y-2"
              >
                <div className="flex flex-wrap gap-1">
                  {commonPresets.concat(additionalPresets).map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                      className="text-xs"
                    >
                      {preset.name}
                    </Button>
                  ))}
                </div>

                <div className="space-y-2">
                  {/* X Pixels */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-1">
                    <Label className="sm:w-1/3 text-xs">X像素数</Label>
                    <HelpTooltip content="相机传感器在水平方向上的像素数量" />
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileFocus={{ scale: 1.02 }}
                    >
                      <Input
                        type="number"
                        {...register("x_pixels")}
                        className="flex-1 text-black text-xs"
                        placeholder="例如: 4144"
                      />
                    </motion.div>
                    <span className="text-xs">个</span>
                  </div>
                  {errors.x_pixels && (
                    <p className="text-red-400 text-xs">
                      {errors.x_pixels.message}
                    </p>
                  )}

                  {/* X Pixel Size */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-1">
                    <Label className="sm:w-1/3 text-xs">X像素大小</Label>
                    <HelpTooltip content="相机传感器在水平方向上的像素大小" />
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileFocus={{ scale: 1.02 }}
                    >
                      <Input
                        type="number"
                        step="0.01"
                        {...register("x_pixel_size")}
                        className="flex-1 text-black text-xs"
                        placeholder="例如: 4.63"
                      />
                    </motion.div>
                    <span className="text-xs">µm</span>
                  </div>
                  {errors.x_pixel_size && (
                    <p className="text-red-400 text-xs">
                      {errors.x_pixel_size.message}
                    </p>
                  )}

                  {/* Y Pixels */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-1">
                    <Label className="sm:w-1/3 text-xs">Y像素数</Label>
                    <HelpTooltip content="相机传感器在垂直方向上的像素数量" />
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileFocus={{ scale: 1.02 }}
                    >
                      <Input
                        type="number"
                        {...register("y_pixels")}
                        className="flex-1 text-black text-xs"
                        placeholder="例如: 2822"
                      />
                    </motion.div>
                    <span className="text-xs">个</span>
                  </div>
                  {errors.y_pixels && (
                    <p className="text-red-400 text-xs">
                      {errors.y_pixels.message}
                    </p>
                  )}

                  {/* Y Pixel Size */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-1">
                    <Label className="sm:w-1/3 text-xs">Y像素大小</Label>
                    <HelpTooltip content="相机传感器在垂直方向上的像素大小" />
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileFocus={{ scale: 1.02 }}
                    >
                      <Input
                        type="number"
                        step="0.01"
                        {...register("y_pixel_size")}
                        className="flex-1 text-black text-xs"
                        placeholder="例如: 4.63"
                      />
                    </motion.div>
                    <span className="text-xs">µm</span>
                  </div>
                  {errors.y_pixel_size && (
                    <p className="text-red-400 text-xs">
                      {errors.y_pixel_size.message}
                    </p>
                  )}

                  {/* Focal Length */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-1">
                    <Label className="sm:w-1/3 text-xs">焦距</Label>
                    <HelpTooltip content="相机镜头的焦距" />
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileFocus={{ scale: 1.02 }}
                    >
                      <Input
                        type="number"
                        step="0.1"
                        {...register("focal_length")}
                        className="flex-1 text-black text-xs"
                        placeholder="例如: 2600"
                      />
                    </motion.div>
                    <span className="text-xs">mm</span>
                  </div>
                  {errors.focal_length && (
                    <p className="text-red-400 text-xs">
                      {errors.focal_length.message}
                    </p>
                  )}

                  {/* Rotation */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-1">
                    <Label className="sm:w-1/3 text-xs">旋转角度</Label>
                    <HelpTooltip content="相机的旋转角度" />
                    <Controller
                      control={control}
                      name="rotation"
                      render={({ field }) => (
                        <div className="flex-1">
                          <Slider
                            min={0}
                            max={360}
                            step={1}
                            value={[field.value]}
                            onValueChange={(value: number[]) =>
                              field.onChange(value[0])
                            }
                            className="mt-1"
                          />
                          <span className="text-xs">{field.value}°</span>
                        </div>
                      )}
                    />
                  </div>
                  {errors.rotation && (
                    <p className="text-red-400 text-xs">
                      {errors.rotation.message}
                    </p>
                  )}
                </div>

                <div className="flex space-x-1">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      type="submit"
                      className="flex-1 flex items-center justify-center text-xs"
                    >
                      <Calculator className="w-3 h-3 mr-1" />
                      保存
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => reset()}
                      className="flex-1 flex items-center justify-center text-xs"
                    >
                      重置
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={exportData}
                      className="flex-1 flex items-center justify-center text-xs"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      导出
                    </Button>
                  </motion.div>
                </div>
              </form>

              {/* 右侧：预览区域 */}
              <motion.div
                className="flex-1 bg-gray-700 rounded-lg p-2 flex flex-col items-center"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <h3 className="font-semibold mb-2 text-center text-xs flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  预览
                </h3>

                <div className="w-full">
                  <motion.div
                    className="relative aspect-video border border-gray-600 rounded-lg overflow-hidden"
                    style={{
                      transform: `scale(${previewZoom})`,
                      transformOrigin: "center",
                    }}
                    whileHover={{ scale: previewZoom * 1.01 }}
                  >
                    {showCrosshair && (
                      <>
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-yellow-400/50" />
                        <div className="absolute top-1/2 left-0 right-0 h-px bg-yellow-400/50" />
                      </>
                    )}

                    {showGridlines && (
                      <motion.div
                        className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.2 }}
                        transition={{ delay: 0.2 }}
                      >
                        {Array.from({ length: 36 }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="border border-gray-500"
                            whileHover={{
                              backgroundColor: "rgba(255,255,255,0.1)",
                            }}
                          />
                        ))}
                      </motion.div>
                    )}

                    <motion.div
                      className="absolute inset-2 border-2 border-yellow-400 bg-yellow-400/50"
                      style={{
                        transform: `rotate(${getValues("rotation")}deg)`,
                        transformOrigin: "center",
                      }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 0.5, scale: 1 }}
                      transition={{
                        duration: 0.5,
                        ease: "easeInOut",
                      }}
                    />
                  </motion.div>

                  <FOVInfo getValues={getValues} />
                </div>
              </motion.div>
            </div>

            {/* 焦距计算器 */}
            <FocalLengthCalculator
              aperture={aperture}
              fRatio={fRatio}
              setAperture={setAperture}
              setFRatio={setFRatio}
              reset={reset}
              getValues={getValues}
            />

            {/* 在对话框内容中添加新的预览控制选项 */}
            <PreviewControls
              showGridlines={showGridlines}
              setShowGridlines={setShowGridlines}
              showCrosshair={showCrosshair}
              setShowCrosshair={setShowCrosshair}
              previewZoom={previewZoom}
              setPreviewZoom={setPreviewZoom}
            />
          </motion.div>
        </DialogContent>
        <DialogFooter className="mt-3">
          <div className="flex gap-1 w-full">
            <Button
              variant="outline"
              onClick={() => setShowPresetManager(true)}
              className="flex-1 text-xs flex items-center gap-1"
            >
              <Settings className="w-3 h-3" />
              管理预设
            </Button>
            <Button
              variant="outline"
              onClick={() => setViewState({ showFovDialog: false })}
              className="flex-1 text-xs"
            >
              取消
            </Button>
          </div>
        </DialogFooter>
      </motion.div>

      {/* 预设管理对话框 */}
      <PresetManager
        open={showPresetManager}
        onOpenChange={setShowPresetManager}
        applyPreset={applyPreset}
        customPresets={customPresets}
        setCustomPresets={setCustomPresets}
        getValues={getValues}
      />

      {/* 在对话框内容中添加新的预览控制选项 */}
      <AddPreset
        presetGroups={presetGroups}
        setPresetGroups={setPresetGroups}
        applyPreset={applyPreset}
      />
    </Dialog>
  );
};
