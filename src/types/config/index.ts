export interface Settings {
  Response: SettingsResponse;
  Error: string;
  StatusCode: number;
  Success: boolean;
  Type: string;
}

export interface SettingsResponse {
  Name: string;
  Description: string;
  Id: string;
  LastUsed: string;
  ApplicationSettings: ApplicationSettings;
  AstrometrySettings: AstrometrySettings;
  CameraSettings: CameraSettings;
  ColorSchemaSettings: ColorSchemaSettings;
  DomeSettings: DomeSettings;
  FilterWheelSettings: FilterWheelSettings;
  FlatWizardSettings: FlatWizardSettings;
  FocuserSettings: FocuserSettings;
  FramingAssistantSettings: FramingAssistantSettings;
  GuiderSettings: GuiderSettings;
  ImageFileSettings: ImageFileSettings;
  ImageSettings: ImageSettings;
  MeridianFlipSettings: MeridianFlipSettings;
  PlanetariumSettings: PlanetariumSettings;
  PlateSolveSettings: PlateSolveSettings;
  RotatorSettings: RotatorSettings;
  FlatDeviceSettings: FlatDeviceSettings;
  SequenceSettings: SequenceSettings;
  SwitchSettings: SwitchSettings;
  TelescopeSettings: TelescopeSettings;
  WeatherDataSettings: WeatherDataSettings;
  SnapShotControlSettings: SnapShotControlSettings;
  SafetyMonitorSettings: SafetyMonitorSettings;
  AlpacaSettings: AlpacaSettings;
  ImageHistorySettings: ImageHistorySettings;
}

export interface ApplicationSettings {
  Culture: string;
  DevicePollingInterval: number;
  PageSize: number;
  LogLevel: string;
}

export interface AstrometrySettings {
  Latitude: number;
  Longitude: number;
  Elevation: number;
  HorizonFilePath: string;
}

export interface CameraSettings {
  BitDepth: number;
  BulbMode: string;
  Id: string;
  PixelSize: number;
  RawConverter: string;
  SerialPort: string;
  MinFlatExposureTime: number;
  MaxFlatExposureTime: number;
  FileCameraFolder: string;
  FileCameraUseBulbMode: boolean;
  FileCameraIsBayered: boolean;
  FileCameraExtension: string;
  FileCameraAlwaysListen: boolean;
  FileCameraDownloadDelay: number;
  BayerPattern: string;
  FLIEnableFloodFlush: boolean;
  FLIEnableSnapshotFloodFlush: boolean;
  FLIFloodDuration: number;
  FLIFlushCount: number;
  BitScaling: boolean;
  CoolingDuration: number;
  WarmingDuration: number;
  Temperature: number;
  Gain: number;
  Offset: number;
  QhyIncludeOverscan: boolean;
  Timeout: number;
  DewHeaterOn: boolean;
  ASCOMAllowUnevenPixelDimension: boolean;
  MirrorLockupDelay: number;
  BinAverageEnabled: boolean;
  TrackingCameraASCOMServerEnabled: boolean;
  TrackingCameraASCOMServerPipeName: string;
  TrackingCameraASCOMServerLoggingEnabled: boolean;
  SBIGUseExternalCcdTracker: boolean;
  AtikGainPreset: number;
  AtikExposureSpeed: number;
  AtikWindowHeaterPowerLevel: number;
  TouptekAlikeUltraMode: boolean;
  TouptekAlikeHighFullwell: boolean;
  TouptekAlikeLEDLights: boolean;
  TouptekAlikeDewHeaterStrength: number;
  GenericCameraDewHeaterStrength: number;
  GenericCameraFanSpeed: number;
  ZwoAsiMonoBinMode: boolean;
  ASCOMCreate32BitData: boolean;
  BadPixelCorrection: boolean;
  BadPixelCorrectionThreshold: number;
}

export interface ColorSchemaSettings {
  AltColorSchema: string;
  ColorSchema: string;
}

export interface DomeSettings {
  Id: string;
  ScopePositionEastWest_mm: number;
  ScopePositionNorthSouth_mm: number;
  ScopePositionUpDown_mm: number;
  DomeRadius_mm: number;
  GemAxis_mm: number;
  LateralAxis_mm: number;
  AzimuthTolerance_degrees: number;
  FindHomeBeforePark: boolean;
  DomeSyncTimeoutSeconds: number;
  SynchronizeDuringMountSlew: boolean;
  SyncSlewDomeWhenMountSlews: boolean;
  RotateDegrees: number;
  CloseOnUnsafe: boolean;
  ParkMountBeforeShutterMove: boolean;
  RefuseUnsafeShutterMove: boolean;
  RefuseUnsafeShutterOpenSansSafetyDevice: boolean;
  ParkDomeBeforeShutterMove: boolean;
  MountType: string;
  DecOffsetHorizontal_mm: number;
  SettleTimeSeconds: number;
}

export interface FilterWheelSettings {
  FilterWheelFilters: FilterWheelFilter[];
  Id: string;
  DisableGuidingOnFilterChange: boolean;
  Unidirectional: boolean;
}

export interface FilterWheelFilter {
  Name: string;
  FocusOffset: number;
  Position: number;
  AutoFocusExposureTime: number;
  AutoFocusFilter: boolean;
  FlatWizardFilterSettings: FlatWizardFilterSettings;
  AutoFocusBinning: AutoFocusBinning;
  AutoFocusGain: number;
  AutoFocusOffset: number;
}

export interface FlatWizardFilterSettings {
  FlatWizardMode: string;
  HistogramMeanTarget: number;
  HistogramTolerance: number;
  MaxFlatExposureTime: number;
  MinFlatExposureTime: number;
  MaxAbsoluteFlatDeviceBrightness: number;
  MinAbsoluteFlatDeviceBrightness: number;
  Gain: number;
  Offset: number;
  Binning: Binning;
}

export interface AutoFocusBinning {
  Name: string;
  X: number;
  Y: number;
}

export interface Binning {
  Name: string;
  X: number;
  Y: number;
}

export interface FlatWizardSettings {
  FlatCount: number;
  HistogramMeanTarget: number;
  HistogramTolerance: number;
  DarkFlatCount: number;
  OpenForDarkFlats: boolean;
  AltitudeSite: number;
  FlatWizardMode: string;
}

export interface FocuserSettings {
  AutoFocusExposureTime: number;
  AutoFocusInitialOffsetSteps: number;
  AutoFocusStepSize: number;
  Id: string;
  UseFilterWheelOffsets: boolean;
  AutoFocusDisableGuiding: boolean;
  FocuserSettleTime: number;
  AutoFocusTotalNumberOfAttempts: number;
  AutoFocusNumberOfFramesPerPoint: number;
  AutoFocusInnerCropRatio: number;
  AutoFocusOuterCropRatio: number;
  AutoFocusUseBrightestStars: number;
  BacklashIn: number;
  BacklashOut: number;
  AutoFocusBinning: number;
  AutoFocusCurveFitting: string;
  AutoFocusMethod: string;
  ContrastDetectionMethod: string;
  BacklashCompensationModel: string;
  AutoFocusTimeoutSeconds: number;
  RSquaredThreshold: number;
}

export interface FramingAssistantSettings {
  CameraHeight: number;
  CameraWidth: number;
  FieldOfView: number;
  Opacity: number;
  LastSelectedImageSource: string;
  LastRotationAngle: number;
  SaveImageInOfflineCache: boolean;
}

export interface GuiderSettings {
  GuiderName: string;
  DitherPixels: number;
  DitherRAOnly: boolean;
  PHD2GuiderScale: string;
  MaxY: number;
  PHD2HistorySize: number;
  PHD2ServerPort: number;
  PHD2ServerUrl: string;
  PHD2InstanceNumber: number;
  SettleTime: number;
  SettlePixels: number;
  SettleTimeout: number;
  PHD2Path: string;
  AutoRetryStartGuiding: boolean;
  AutoRetryStartGuidingTimeoutSeconds: number;
  MetaGuideUseIpAddressAny: boolean;
  MetaGuidePort: number;
  MGENFocalLength: number;
  MGENPixelMargin: number;
  MetaGuideMinIntensity: number;
  MetaGuideDitherSettleSeconds: number;
  MetaGuideLockWhenGuiding: boolean;
  PHD2ROIPct: number;
  SkyGuardServerPort: number;
  SkyGuardServerUrl: string;
  SkyGuardPath: string;
  SkyGuardCallbackPort: number;
  SkyGuardTimeLapsChecked: boolean;
  SkyGuardValueMaxGuiding: number;
  SkyGuardTimeLapsGuiding: number;
  SkyGuardTimeLapsDitherChecked: boolean;
  SkyGuardValueMaxDithering: number;
  SkyGuardTimeLapsDithering: number;
  SkyGuardTimeOutGuiding: number;
  GuideChartRightAscensionColor: GuideChartColor;
  GuideChartDeclinationColor: GuideChartColor;
  GuideChartShowCorrections: boolean;
}

export interface GuideChartColor {
  A: number;
  R: number;
  G: number;
  B: number;
  ScA: number;
  ScR: number;
  ScG: number;
  ScB: number;
}

export interface ImageFileSettings {
  FilePath: string;
  FilePattern: string;
  FilePatternDARK: string;
  FilePatternBIAS: string;
  FilePatternFLAT: string;
  FileType: string;
  TIFFCompressionType: string;
  XISFCompressionType: string;
  XISFChecksumType: string;
  XISFByteShuffling: boolean;
  FITSCompressionType: string;
  FITSAddFzExtension: boolean;
  FITSUseLegacyWriter: boolean;
}

export interface ImageSettings {
  AnnotateImage: boolean;
  DebayerImage: boolean;
  DebayeredHFR: boolean;
  UnlinkedStretch: boolean;
  AnnotateUnlimitedStars: boolean;
  AutoStretchFactor: number;
  BlackClipping: number;
  StarSensitivity: string;
  NoiseReduction: string;
  DetectStars: boolean;
  AutoStretch: boolean;
}

export interface MeridianFlipSettings {
  MinutesAfterMeridian: number;
  MaxMinutesAfterMeridian: number;
  PauseTimeBeforeMeridian: number;
  Recenter: boolean;
  SettleTime: number;
  UseSideOfPier: boolean;
  AutoFocusAfterFlip: boolean;
  RotateImageAfterFlip: boolean;
}

export interface PlanetariumSettings {
  StellariumHost: string;
  StellariumPort: number;
  CdCHost: string;
  CdCPort: number;
  TSXHost: string;
  TSXPort: number;
  TSXUseSelectedObject: boolean;
  HNSKYHost: string;
  HNSKYPort: number;
  C2AHost: string;
  C2APort: number;
  SkytechXHost: string;
  SkytechXPort: number;
  PreferredPlanetarium: string;
}

export interface PlateSolveSettings {
  AstrometryURL: string;
  AstrometryAPIKey: string;
  BlindSolverType: string;
  CygwinLocation: string;
  ExposureTime: number;
  Gain: number;
  Binning: number;
  PlateSolverType: string;
  PS2Location: string;
  PS3Location: string;
  Regions: number;
  SearchRadius: number;
  Threshold: number;
  RotationTolerance: number;
  ReattemptDelay: number;
  NumberOfAttempts: number;
  AspsLocation: string;
  ASTAPLocation: string;
  DownSampleFactor: number;
  MaxObjects: number;
  Sync: boolean;
  SlewToTarget: boolean;
  BlindFailoverEnabled: boolean;
  TheSkyXHost: string;
  TheSkyXPort: number;
  PinPointCatalogType: string;
  PinPointCatalogRoot: string;
  PinPointMaxMagnitude: number;
  PinPointExpansion: number;
  PinPointAllSkyApiKey: string;
  PinPointAllSkyApiHost: string;
}

export interface RotatorSettings {
  Id: string;
  Reverse2: boolean;
  RangeType: string;
  RangeStartMechanicalPosition: number;
}

export interface FlatDeviceSettings {
  Id: string;
  PortName: string;
  SettleTime: number;
  TrainedFlatExposureSettings: TrainedFlatExposureSetting[];
}

export interface TrainedFlatExposureSetting {
  exposureTime: number;
  brightness: number;
}

export interface SequenceSettings {
  EstimatedDownloadTime: string;
  TemplatePath: string;
  TimeSpanInTicks: number;
  ParkMountAtSequenceEnd: boolean;
  CloseDomeShutterAtSequenceEnd: boolean;
  ParkDomeAtSequenceEnd: boolean;
  WarmCamAtSequenceEnd: boolean;
  DefaultSequenceFolder: string;
  StartupSequenceTemplate: string;
  SequencerTemplatesFolder: string;
  SequencerTargetsFolder: string;
  CollapseSequencerTemplatesByDefault: boolean;
  CoolCameraAtSequenceStart: boolean;
  UnparMountAtSequenceStart: boolean;
  OpenDomeShutterAtSequenceStart: boolean;
  DoMeridianFlip: boolean;
  DisableSimpleSequencer: boolean;
}

export interface SwitchSettings {
  Id: string;
}

export interface TelescopeSettings {
  Name: string;
  MountName: string;
  FocalLength: number;
  FocalRatio: number;
  Id: string;
  SettleTime: number;
  SnapPortStart: string;
  SnapPortStop: string;
  NoSync: boolean;
  TimeSync: boolean;
  PrimaryReversed: boolean;
  SecondaryReversed: boolean;
  TelescopeLocationSyncDirection: string;
}

export interface WeatherDataSettings {
  Id: string;
  OpenWeatherMapAPIKey: string;
  TheWeatherCompanyAPIKey: string;
  WeatherUndergroundAPIKey: string;
  WeatherUndergroundStation: string;
}

export interface SnapShotControlSettings {
  ExposureDuration: number;
  Gain: number;
  Save: boolean;
  Loop: boolean;
}

export interface SafetyMonitorSettings {
  Id: string;
}

export interface AlpacaSettings {
  NumberOfPolls: number;
  PollInterval: number;
  DiscoveryPort: number;
  DiscoveryDuration: number;
  ResolveDnsName: boolean;
  UseIPv4: boolean;
  UseIPv6: boolean;
  UseHttps: boolean;
}

export interface ImageHistorySettings {
  ImageHistoryLeftSelected: string;
  ImageHistoryRightSelected: string;
}
