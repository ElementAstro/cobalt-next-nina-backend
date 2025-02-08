import { z } from "zod";

export interface FovDataType {
  x_pixels: number;
  x_pixel_size: number;
  y_pixels: number;
  y_pixel_size: number;
  focal_length: number;
}

export interface FOVPreset {
  name: string;
  x_pixels: number;
  y_pixels: number;
  x_pixel_size: number;
  y_pixel_size: number;
  focal_length: number;
}

// 新增预设组接口
export interface PresetGroup {
  id: string;
  name: string;
  presets: FOVPreset[];
}

export const commonPresets: FOVPreset[] = [
  {
    name: "ASI294MM Pro",
    x_pixels: 4144,
    y_pixels: 2822,
    x_pixel_size: 4.63,
    y_pixel_size: 4.63,
    focal_length: 2600,
  },
  {
    name: "Canon EOS R5",
    x_pixels: 8192,
    y_pixels: 5464,
    x_pixel_size: 3.76,
    y_pixel_size: 3.76,
    focal_length: 850,
  },
  // 更多预设...
];

export const additionalPresets: FOVPreset[] = [
  {
    name: "ZWO ASI2600MM Pro",
    x_pixels: 6248,
    y_pixels: 4176,
    x_pixel_size: 3.76,
    y_pixel_size: 3.76,
    focal_length: 1000,
  },
  // ...更多预设
];

export const schema = z.object({
  x_pixels: z
    .number({
      required_error: "必填",
      invalid_type_error: "必须为数字",
    })
    .int("必须为整数")
    .positive("必须为正数"),
  x_pixel_size: z
    .number({
      required_error: "必填",
      invalid_type_error: "必须为数字",
    })
    .positive("必须为正数"),
  y_pixels: z
    .number({
      required_error: "必填",
      invalid_type_error: "必须为数字",
    })
    .int("必须为整数")
    .positive("必须为正数"),
  y_pixel_size: z
    .number({
      required_error: "必填",
      invalid_type_error: "必须为数字",
    })
    .positive("必须为正数"),
  focal_length: z
    .number({
      required_error: "必填",
      invalid_type_error: "必须为数字",
    })
    .positive("必须为正数"),
  rotation: z
    .number({
      required_error: "必填",
      invalid_type_error: "必须为数字",
    })
    .min(0, "最小为0°")
    .max(360, "最大为360°"),
});
