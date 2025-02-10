/****************** 基础类型 ******************/
// 脚本参数类型（支持递归）
export type ScriptArgument =
  | string
  | number
  | boolean
  | null
  | undefined
  | ScriptArgument[]
  | { [key: string]: ScriptArgument };

/****************** 坐标与时间 ******************/
export interface CoordinateData {
  ra: {
    h: number;
    m: number;
    s: number;
  };
  dec: {
    d: number;
    m: number;
    s: number;
  };
  rotation: number;
}

export interface TimelineData {
  time: string;
  value: number;
}

/****************** 任务及相关定义 ******************/
export interface Task {
  id: string;
  name: string;
  duration: number;
  type: string;
  filter: string;
  binning: string;
  count: number;
  category: string;
  enabled: boolean;
  total: number;
  time: string;
  progress: [number, number];
}

export type TaskType =
  | "LIGHT"
  | "DARK"
  | "FLAT"
  | "BIAS"
  | "DITHER"
  | "FOCUS"
  | "GUIDE"
  | "PLATE_SOLVE"
  | "MERIDIAN_FLIP"
  | "FILTER_CHANGE"
  | "MOUNT_PARK"
  | "MOUNT_UNPARK"
  | "CAMERA_COOL"
  | "CAMERA_WARM"
  | "ROTATOR_MOVE"
  | "SCRIPT"
  | "DELAY"
  | "ALERT";

export interface TaskMetadata {
  camera?: {
    gain: number;
    offset: number;
    binning: string;
    temperature: number;
    readoutMode: string;
    usbLimit: number;
    isColorCamera: boolean;
  };
  filter?: {
    name: string;
    offset: number;
    exposure: number;
  };
  mount?: {
    tracking: boolean;
    pierSide: "east" | "west";
    pointingModel: string;
    usePointingModel: boolean;
  };
  focuser?: {
    position: number;
    temperature: number;
    direction: "in" | "out";
    backlash: number;
    step: number;
  };
  guider?: {
    exposure: number;
    pixel: number;
    aggressiveness: number;
    algorithm: string;
  };
  script?: {
    path: string;
    arguments: Record<string, ScriptArgument>;
  };
  rotator?: {
    position: number;
    reverse: boolean;
    syncMount: boolean;
  };
}

// ExposureTask 继承 Task，添加了状态、设置、验证和回滚等属性
export interface ExposureTask extends Task {
  metadata: TaskMetadata;
  status: {
    state: "pending" | "running" | "completed" | "failed" | "paused";
    progress: number;
    startTime?: Date;
    endTime?: Date;
    error?: string;
    attempts: number;
    logs: Array<{
      timestamp: Date;
      level: "info" | "warn" | "error";
      message: string;
    }>;
  };
  settings: {
    dither: boolean;
    ditherScale: number;
    focusCheck: boolean;
    meridianFlip: boolean;
    autoGuide: boolean;
    delay: number;
    repeat: number;
  };
  validation?: {
    minSuccess: number;
    maxRetries: number;
    timeLimit: number;
  };
  rollback?: {
    enabled: boolean;
    tasks: ExposureTask[];
  };
}

export interface TaskGroup {
  id: string;
  name: string;
  tasks: ExposureTask[];
  status: "pending" | "running" | "completed" | "failed" | "paused";
  progress: number;
  settings: {
    concurrent: boolean;
    maxRetries: number;
    timeout: number;
  };
  dependencies?: TaskDependencies;
  rollback?: {
    enabled: boolean;
    tasks: ExposureTask[];
  };
  validation?: {
    minSuccess: number;
    maxRetries: number;
    timeLimit: number;
  };
}

export interface TaskDependencies {
  requiredTasks: string[]; // 依赖的其他任务ID
  optionalTasks: string[]; // 可选的依赖任务ID
  blockingTasks: string[]; // 会阻塞的任务ID
  priority: number; // 任务优先级
}

export interface TaskStatus {
  status: "pending" | "running" | "completed" | "failed" | "paused";
  startTime?: Date;
  endTime?: Date;
  error?: string;
  progress: number;
  remainingTime?: number;
}

/****************** 目标与元数据 ******************/
export interface TargetSettings {
  delayStart: string;
  sequenceMode: string;
  startTime: string;
  endTime: string;
  duration: string;
  retryCount?: number;
  timeout?: number;
  coolCamera: boolean;
  unparkMount: boolean;
  meridianFlip: boolean;
  warmCamera: boolean;
  parkMount: boolean;
}

export interface Target {
  id: string;
  name: string;
  category?: string;
  coordinates: CoordinateData;
  tasks: ExposureTask[];
  settings: TargetSettings;
}

/****************** 执行状态 ******************/

export interface ExecutionStatus {
  state: "idle" | "running" | "paused" | "completed" | "error";
  currentTask?: string;
  progress: number;
  startTime?: Date;
  endTime?: Date;
  remainingTime?: number;
  errors: string[];
  warnings: string[];
}

/****************** 系统提示 ******************/
export interface Notification {
  id: string;
  type: "info" | "success" | "error" | "warning";
  message: string;
  timestamp: Date;
  read: boolean;
}
