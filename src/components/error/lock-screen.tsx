"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LockIcon,
  UnlockIcon,
  SunIcon,
  ThermometerIcon,
  BellIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  SettingsIcon,
  CloudMoonIcon,
  FingerprintIcon,
  Compass,
  Camera,
  Wind,
  Star,
  ChevronLeft,
} from "lucide-react";
import { create } from "zustand";
import { Label } from "@/components/ui/label";
import { useWeatherStore } from "@/stores/weatherStore";
import { useCameraStore } from "@/stores/cameraStore";
import { useLogStore } from "@/stores/logStore";
import { useRouter } from "next/router";
import { LogEntry } from "@/types/log";

interface LockScreenState {
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  lastActivityTime: number;
  updateLastActivityTime: () => void;
}

export const useLockScreenStore = create<LockScreenState>((set) => ({
  isLocked: true,
  setIsLocked: (locked) => set({ isLocked: locked }),
  lastActivityTime: Date.now(),
  updateLastActivityTime: () => set({ lastActivityTime: Date.now() }),
}));

interface MinimalModeConfig {
  showTime?: boolean;
  showWeather?: boolean;
  showNotifications?: boolean;
  showMusicControls?: boolean;
  showQuickLaunch?: boolean;
  showStatusIndicators?: boolean;
}

interface LockScreenProps {
  backgroundImage?: string;
  showWeather?: boolean;
  batteryLevel?: number;
  isCharging?: boolean;
  isConnected?: boolean;
  minimalMode?: boolean;
  minimalModeConfig?: MinimalModeConfig;
  inactivityTimeout?: number; // Add inactivity timeout prop
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      when: "beforeChildren",
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.1,
      staggerDirection: -1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
    },
  },
  hover: {
    scale: 1.05,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 15,
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20,
    },
  },
};

export default function LockScreen({
  backgroundImage = "/placeholder.svg?height=1080&width=1920",
  // 从 props 移除天气、batteryLevel、isConnected 等，将通过 store 获取
  minimalMode = false,
  minimalModeConfig = {
    showTime: true,
    showWeather: true,
    showNotifications: true,
    showMusicControls: true,
    showQuickLaunch: true,
    showStatusIndicators: true,
  },
  inactivityTimeout = 60000, // Default to 60 seconds
}: LockScreenProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { setIsLocked, updateLastActivityTime } = useLockScreenStore();
  const [isDarkMode] = useState(false);
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [isNotificationExpanded, setIsNotificationExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lockTimeout = useRef<NodeJS.Timeout | null>(null);

  // 从 store 获取天气、设备状态以及通知日志
  const weatherStore = useWeatherStore();
  const cameraStore = useCameraStore();
  const logStore = useLogStore();
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const resetInactivityTimeout = useCallback(() => {
    if (lockTimeout.current) {
      clearTimeout(lockTimeout.current);
    }

    lockTimeout.current = setTimeout(() => {
      setIsLocked(true);
    }, inactivityTimeout);
  }, [inactivityTimeout, setIsLocked]);

  useEffect(() => {
    // Reset timeout on component mount
    resetInactivityTimeout();

    // Clear timeout on component unmount
    return () => {
      if (lockTimeout.current) {
        clearTimeout(lockTimeout.current);
      }
    };
  }, [inactivityTimeout, resetInactivityTimeout, setIsLocked]);

  // Reset inactivity timer on user activity
  useEffect(() => {
    const handleUserActivity = () => {
      updateLastActivityTime();
      resetInactivityTimeout();
    };

    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("keydown", handleUserActivity);
    window.addEventListener("click", handleUserActivity);

    return () => {
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("click", handleUserActivity);
    };
  }, [
    updateLastActivityTime,
    setIsLocked,
    inactivityTimeout,
    resetInactivityTimeout,
  ]);

  const handleQuickLaunch = (app: string) => {
    router.push(`/${app}`);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "1234") {
      setIsLocked(false);
      resetInactivityTimeout(); // Reset timeout on successful unlock
    } else {
      alert("密码错误，请重试");
      setPassword("");
    }
  };

  const handleBiometricAuth = () => {
    // 添加生物识别认证逻辑
    alert("生物识别认证成功");
    setIsLocked(false);
    resetInactivityTimeout(); // Reset timeout on successful unlock
  };

  const handleUnlock = (value: number[]) => {
    if (value[0] === 100) {
      setIsLocked(false);
      resetInactivityTimeout(); // Reset timeout on successful unlock
    }
  };

  const toggleNotifications = () => {
    setIsNotificationExpanded(!isNotificationExpanded);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`relative flex flex-col md:flex-row items-stretch justify-between h-screen overflow-hidden bg-cover bg-center ${
        isDarkMode ? "dark" : ""
      }`}
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div
        className={`absolute inset-0 ${
          isDarkMode ? "bg-black/70" : "bg-black/30"
        } backdrop-blur-md transition-colors duration-500`}
      ></div>

      {/* 左侧: 时间和天气 */}
      {(!minimalMode || minimalModeConfig.showTime) && (
        <motion.div
          variants={containerVariants}
          className="z-10 text-white p-4 w-full md:w-1/3 flex flex-col justify-center items-start"
        >
          <motion.h1
            variants={itemVariants}
            className="text-3xl font-bold mb-1"
          >
            {currentTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </motion.h1>
          <motion.h2 variants={itemVariants} className="text-base mb-2">
            {currentTime.toLocaleDateString([], {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </motion.h2>

          {/* 天气信息：仅当 weatherStore 已连接且有数据时显示 */}
          {weatherStore.isConnected &&
            weatherStore.temperature &&
            minimalModeConfig.showWeather && (
              <motion.div
                variants={itemVariants}
                className="flex flex-col gap-1 text-sm"
              >
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-1">
                    {/* 简单使用 SunIcon，根据实际情况可以扩展映射 */}
                    <SunIcon />
                  </div>
                  <Label>{weatherStore.temperature}°C</Label>
                  <ThermometerIcon className="w-4 h-4 ml-1" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 text-xs text-white/80">
                  <div className="flex items-center">
                    <ThermometerIcon className="w-3 h-3 mr-1" />
                    <Label>湿度: {weatherStore.humidity}%</Label>
                  </div>
                  <div className="flex items-center">
                    <Wind className="w-3 h-3 mr-1" />
                    <Label>风速: {weatherStore.windSpeed} km/h</Label>
                  </div>
                </div>
              </motion.div>
            )}

          {/* 状态指示器：显示设备状态，仅当 cameraStore 已连接时显示 */}
          {cameraStore.isConnected &&
            minimalModeConfig.showStatusIndicators && (
              <motion.div
                variants={itemVariants}
                className="flex items-center gap-2 mt-2 text-sm"
              >
                <div className="flex items-center">
                  <Label>相机温度: {cameraStore.temperature}°C</Label>
                </div>
              </motion.div>
            )}
        </motion.div>
      )}

      {/* 中间: 控制区 */}
      {(!minimalMode || minimalModeConfig.showMusicControls) && (
        <motion.div
          variants={containerVariants}
          className="z-10 w-full md:w-1/3 p-4 flex flex-col justify-center"
        >
          {/* 解锁控制代码保持不变 */}
          <AnimatePresence>
            {showPasswordInput ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
              >
                <motion.form
                  onSubmit={handlePasswordSubmit}
                  className="mb-2"
                  variants={itemVariants}
                >
                  <Input
                    type="password"
                    placeholder="输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-8 text-sm mb-1"
                  />
                  <Button type="submit" size="sm" className="w-full h-8 mb-2">
                    密码解锁
                  </Button>
                </motion.form>
                <motion.div
                  variants={itemVariants}
                  className="flex justify-center gap-2"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 flex-1"
                    onClick={handleBiometricAuth}
                  >
                    <FingerprintIcon className="w-3 h-3 mr-1" />
                    生物识别
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 flex-1"
                    onClick={() => setShowPasswordInput(false)}
                  >
                    <ChevronLeft className="w-3 h-3 mr-1" />
                    返回
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div variants={itemVariants} className="mb-2">
                <div className="bg-white/20 p-1 rounded-full mb-1">
                  <Slider
                    defaultValue={[0]}
                    max={100}
                    step={1}
                    onValueChange={handleUnlock}
                    className="w-full"
                  />
                </div>
                <p className="text-center text-white text-xs">
                  <LockIcon className="inline w-3 h-3 mr-1" />
                  滑动解锁
                  <UnlockIcon className="inline w-3 h-3 ml-1" />
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* 右侧: 通知 */}
      {minimalModeConfig.showNotifications && logStore.logs.length > 0 && (
        <motion.div
          variants={containerVariants}
          className="z-10 w-full md:w-1/3 p-4 flex flex-col justify-center"
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-white text-sm flex items-center">
              <BellIcon className="w-4 h-4 mr-1" /> 通知
            </h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={toggleNotifications}
            >
              {isNotificationExpanded ? (
                <ChevronUpIcon className="w-4 h-4 text-white" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 text-white" />
              )}
            </Button>
          </div>

          <AnimatePresence>
            {isNotificationExpanded && (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="space-y-1 max-h-[40vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20"
              >
                {logStore.logs.map((notification: LogEntry) => (
                  <motion.div
                    key={notification.id}
                    variants={itemVariants}
                    className={`backdrop-blur-md rounded-lg p-2 ${
                      notification.level === "error"
                        ? "bg-red-500/20 border-red-500/30"
                        : notification.level === "warn"
                        ? "bg-yellow-500/20 border-yellow-500/30"
                        : notification.level === "info"
                        ? "bg-green-500/20 border-green-500/30"
                        : "bg-white/20 border-white/30"
                    } border`}
                  >
                    <div className="flex items-center">
                      <div className="w-4 h-4 flex-shrink-0">
                        {/* 此处可以根据 notification.level 选择不同图标 */}
                        <BellIcon />
                      </div>
                      <div className="ml-2 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-white text-xs font-medium truncate">
                            {notification.id || "通知"}
                          </h4>
                          <Label className="text-xs text-white/50 ml-2">
                            {Math.floor(
                              (Date.now() -
                                (notification.timestamp as unknown as number)) /
                                60000
                            )}
                            分钟前
                          </Label>
                        </div>
                        <p className="text-white/80 text-xs truncate">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 快速启动部分保持不变 */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-4 gap-1 mt-2"
          >
            {[
              {
                icon: <Camera className="w-4 h-4" />,
                action: () => handleQuickLaunch("CameraControl"),
                label: "相机控制",
              },
              {
                icon: <Compass className="w-4 h-4" />,
                action: () => handleQuickLaunch("MountControl"),
                label: "赤道仪控制",
              },
              {
                icon: <CloudMoonIcon className="w-4 h-4" />,
                action: () => handleQuickLaunch("WeatherMonitor"),
                label: "天气监测",
              },
              {
                icon: <Star className="w-4 h-4" />,
                action: () => handleQuickLaunch("PolarAlignment"),
                label: "极轴校准",
              },
              {
                icon: <SettingsIcon className="w-4 h-4" />,
                action: () => handleQuickLaunch("Settings"),
                label: "系统设置",
              },
            ].map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={item.action}
              >
                <div className="w-4 h-4 text-white">{item.icon}</div>
              </Button>
            ))}
          </motion.div>
        </motion.div>
      )}

      <audio ref={audioRef} src="/path-to-your-audio-file.mp3" />
    </motion.div>
  );
}
