import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface PreviewControlsProps {
  showGridlines: boolean;
  setShowGridlines: React.Dispatch<React.SetStateAction<boolean>>;
  showCrosshair: boolean;
  setShowCrosshair: React.Dispatch<React.SetStateAction<boolean>>;
  previewZoom: number;
  setPreviewZoom: React.Dispatch<React.SetStateAction<number>>;
}

export const PreviewControls: React.FC<PreviewControlsProps> = ({
  showGridlines,
  setShowGridlines,
  showCrosshair,
  setShowCrosshair,
  previewZoom,
  setPreviewZoom,
}) => {
  return (
    <div className="flex items-center space-x-2 mt-2">
      <Switch
        checked={showGridlines}
        onCheckedChange={setShowGridlines}
        id="grid-lines"
      />
      <Label htmlFor="grid-lines">网格线</Label>

      <Switch
        checked={showCrosshair}
        onCheckedChange={setShowCrosshair}
        id="crosshair"
      />
      <Label htmlFor="crosshair">十字准线</Label>

      <Slider
        value={[previewZoom]}
        min={0.5}
        max={2}
        step={0.1}
        onValueChange={(value) => setPreviewZoom(value[0])}
        className="w-32"
      />
      <span className="text-xs">缩放: {previewZoom.toFixed(1)}x</span>
    </div>
  );
};
