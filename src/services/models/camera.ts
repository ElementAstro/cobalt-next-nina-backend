export interface CameraResponse {
  Response: CameraData;
  Error: string;
  StatusCode: number;
  Success: boolean;
  Type: string;
}

export interface CameraData {
  TargetTemp: number;
  AtTargetTemp: boolean;
  CanSetTemperature: boolean;
  HasShutter: boolean;
  Temperature: number;
  Gain: number;
  DefaultGain: number;
  ElectronsPerADU: number;
  BinX: number;
  BitDepth: number;
  BinY: number;
  CanSetOffset: boolean;
  CanGetGain: boolean;
  OffsetMin: number;
  OffsetMax: number;
  Offset: number;
  DefaultOffset: number;
  USBLimit: number;
  IsSubSampleEnabled: boolean;
  CameraState: number;
  XSize: number;
  YSize: number;
  PixelSize: number;
  Battery: number;
  GainMin: number;
  GainMax: number;
  CanSetGain: boolean;
  Gains: (number | null)[];
  CoolerOn: boolean;
  CoolerPower: number;
  HasDewHeater: boolean;
  DewHeaterOn: boolean;
  CanSubSample: boolean;
  SubSampleX: number;
  SubSampleY: number;
  SubSampleWidth: number;
  SubSampleHeight: number;
  TemperatureSetPoint: number;
  ReadoutModes: string[];
  ReadoutMode: number;
  ReadoutModeForSnapImages: number;
  ReadoutModeForNormalImages: number;
  IsExposing: boolean;
  ExposureEndTime: string;
  LastDownloadTime: number;
  SensorType: number;
  BayerOffsetX: number;
  BayerOffsetY: number;
  BinningModes: BinningMode[];
  ExposureMax: number;
  ExposureMin: number;
  LiveViewEnabled: boolean;
  CanShowLiveView: boolean;
  SupportedActions: string[];
  CanSetUSBLimit: boolean;
  USBLimitMin: number;
  USBLimitMax: number;
  Connected: boolean;
  Name: string;
  DisplayName: string;
  DeviceId: string;
}

export interface BinningMode {
  Name: string;
  X: number;
  Y: number;
}
