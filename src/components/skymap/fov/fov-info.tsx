import React from "react";
import { Label } from "@/components/ui/label";

interface FOVInfoProps {
  getValues: (field: string) => number;
}

const FOVInfo: React.FC<FOVInfoProps> = ({ getValues }) => {
  const x_pixels = getValues("x_pixels");
  const x_pixel_size = getValues("x_pixel_size");
  const y_pixels = getValues("y_pixels");
  const y_pixel_size = getValues("y_pixel_size");
  const focal_length = getValues("focal_length");

  const fovWidth = ((x_pixels * x_pixel_size * 206.265) / focal_length).toFixed(
    2
  );
  const fovHeight = (
    (y_pixels * y_pixel_size * 206.265) /
    focal_length
  ).toFixed(2);
  const resolution = ((206.265 * x_pixel_size) / focal_length).toFixed(2);
  const samplingRate = ((x_pixel_size * 2) / focal_length).toFixed(2);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-xs">
      <div className="text-center">
        <Label>视场宽度:</Label> {fovWidth} ′
      </div>
      <div className="text-center">
        <Label>视场高度:</Label> {fovHeight} ′
      </div>
      <div className="text-center">
        <Label>分辨率:</Label> {resolution} ″/px
      </div>
      <div className="text-center">
        <Label>采样率:</Label> {samplingRate} ″/px
      </div>
    </div>
  );
};

export default FOVInfo;
