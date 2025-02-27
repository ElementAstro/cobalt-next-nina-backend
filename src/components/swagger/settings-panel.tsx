import { useState } from "react";
import { useSettingsStore } from "@/stores/swagger/settingsStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type HighlightColor = "blue" | "green" | "purple" | "red" | "orange";
type LayoutMode = "default" | "vertical" | "horizontal" | "compact";

export default function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const {
    theme,
    layout,
    fontSize,
    enableAnimations,
    highlightColor,
    codeWrap,
    showDeprecated,
    autoExpand,
    setTheme,
    setLayout,
    setFontSize,
    setEnableAnimations,
    setHighlightColor,
    setCodeWrap,
    setShowDeprecated,
    setAutoExpand,
  } = useSettingsStore();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>设置</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>设置面板</DialogTitle>
          <DialogDescription>
            自定义Swagger文档面板的显示和行为
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="appearance">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="appearance">外观</TabsTrigger>
            <TabsTrigger value="layout">布局</TabsTrigger>
            <TabsTrigger value="behavior">行为</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-4">
            <div className="space-y-2">
              <Label>主题</Label>
              <Select
                value={theme}
                onValueChange={(value) =>
                  setTheme(value as "light" | "dark" | "system")
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择主题" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">浅色</SelectItem>
                  <SelectItem value="dark">深色</SelectItem>
                  <SelectItem value="system">跟随系统</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>字体大小: {fontSize}px</Label>
              <Slider
                value={[fontSize]}
                min={12}
                max={20}
                step={1}
                onValueChange={([value]) => setFontSize(value)}
              />
            </div>

            <div className="space-y-2">
              <Label>强调色</Label>
              <Select
                value={highlightColor}
                onValueChange={(value: HighlightColor) =>
                  setHighlightColor(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择强调色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="blue">蓝色</SelectItem>
                  <SelectItem value="green">绿色</SelectItem>
                  <SelectItem value="purple">紫色</SelectItem>
                  <SelectItem value="red">红色</SelectItem>
                  <SelectItem value="orange">橙色</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="animations">启用动画效果</Label>
              <Switch
                id="animations"
                checked={enableAnimations}
                onCheckedChange={setEnableAnimations}
              />
            </div>
          </TabsContent>

          <TabsContent value="layout" className="space-y-4">
            <div className="space-y-2">
              <Label>布局模式</Label>
              <Select
                value={layout}
                onValueChange={(value: LayoutMode) => setLayout(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择布局" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">默认</SelectItem>
                  <SelectItem value="vertical">垂直</SelectItem>
                  <SelectItem value="horizontal">水平</SelectItem>
                  <SelectItem value="compact">紧凑</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="codeWrap">代码示例自动换行</Label>
              <Switch
                id="codeWrap"
                checked={codeWrap}
                onCheckedChange={setCodeWrap}
              />
            </div>
          </TabsContent>

          <TabsContent value="behavior" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="deprecated">显示已弃用的接口</Label>
              <Switch
                id="deprecated"
                checked={showDeprecated}
                onCheckedChange={setShowDeprecated}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="autoExpand">自动展开端点详情</Label>
              <Switch
                id="autoExpand"
                checked={autoExpand}
                onCheckedChange={setAutoExpand}
              />
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
