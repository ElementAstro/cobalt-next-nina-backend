"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  LockIcon,
  KeyIcon,
  SunIcon,
  ThermometerIcon,
  BellIcon,
  ChevronDownIcon,
  SettingsIcon,
  CloudMoonIcon,
  FingerprintIcon,
  Compass,
  Camera,
  Wind,
  Star,
  ChevronLeft,
  AlertTriangle,
  AlertCircle,
  Info,
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
      <motion.div
        initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
        animate={{
          opacity: 1,
          backdropFilter: "blur(20px)",
          background: isDarkMode
            ? "linear-gradient(to bottom, rgba(0,0,0,0.8), rgba(0,0,0,0.7))"
            : "linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.3))",
        }}
        transition={{
          duration: 1,
          backdropFilter: {
            duration: 1.2,
            ease: "easeInOut",
          },
        }}
        className="absolute inset-0 transition-colors duration-500"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40 pointer-events-none" />
      </motion.div>

      {/* 左侧: 时间和天气 */}
      {(!minimalMode || minimalModeConfig.showTime) && (
        <motion.div
          variants={containerVariants}
          className="z-10 text-white p-4 w-full md:w-1/3 flex flex-col justify-center items-start"
        >
          <div className="space-y-6">
            <motion.div
              variants={itemVariants}
              className="flex flex-col space-y-1"
            >
              <motion.h1
                variants={itemVariants}
                className="text-6xl font-bold tracking-tight"
                style={{
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                {currentTime.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </motion.h1>
              <motion.h2
                variants={itemVariants}
                className="text-lg font-medium text-white/80"
              >
                {currentTime.toLocaleDateString([], {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </motion.h2>
            </motion.div>

            {/* 天气信息：仅当 weatherStore 已连接且有数据时显示 */}
            {weatherStore.isConnected &&
              weatherStore.temperature &&
              minimalModeConfig.showWeather && (
                <motion.div
                  variants={itemVariants}
                  className="space-y-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <SunIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold">
                        {weatherStore.temperature}°C
                      </div>
                      <div className="text-sm text-white/60">当前气温</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                    <div className="flex items-center space-x-2">
                      <ThermometerIcon className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="text-sm font-medium">
                          {weatherStore.humidity}%
                        </div>
                        <div className="text-xs text-white/60">相对湿度</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Wind className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="text-sm font-medium">
                          {weatherStore.windSpeed} km/h
                        </div>
                        <div className="text-xs text-white/60">风速</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
          </div>

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
                className="max-w-sm mx-auto w-full"
              >
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl">
                  <div className="flex items-center gap-3 mb-6">
                    <KeyIcon className="w-6 h-6 text-white/80" />
                    <h2 className="text-lg font-medium text-white/80">
                      请输入密码
                    </h2>
                  </div>

                  <motion.form
                    onSubmit={handlePasswordSubmit}
                    className="space-y-4"
                    variants={itemVariants}
                  >
                    <div className="relative">
                      <Input
                        type="password"
                        placeholder="输入密码"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-12 text-lg bg-white/10 border-white/20 rounded-xl pl-12
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent
                          transition-all duration-200"
                      />
                      <LockIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="submit"
                        className="h-12 bg-blue-500/90 hover:bg-blue-500 text-white
                          rounded-xl shadow-lg shadow-blue-500/20
                          transition-all duration-200 hover:scale-105"
                      >
                        确认解锁
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setShowPasswordInput(false)}
                        className="h-12 border border-white/20 text-white hover:bg-white/10
                          rounded-xl backdrop-blur-sm
                          transition-all duration-200 hover:scale-105
                          flex items-center justify-center gap-2"
                      >
                        <ChevronLeft className="w-5 h-5" />
                        返回
                      </Button>
                    </div>
                  </motion.form>

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <Button
                      variant="ghost"
                      onClick={handleBiometricAuth}
                      className="w-full text-white/60 hover:text-white hover:bg-white/10
                        transition-all duration-200 rounded-xl h-12
                        flex items-center justify-center gap-2"
                    >
                      <FingerprintIcon className="w-5 h-5" />
                      使用生物识别
                    </Button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                variants={itemVariants}
                className="max-w-sm mx-auto w-full space-y-4"
              >
                <div className="relative">
                  <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl">
                    <div className="mb-4">
                      <motion.div
                        className="flex justify-center items-center gap-3 mb-4"
                        animate={{ opacity: [0.6, 1, 0.6] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <LockIcon className="w-6 h-6 text-white/80" />
                        <span className="text-lg font-medium text-white/80">
                          向右滑动解锁
                        </span>
                      </motion.div>
                      <Slider
                        defaultValue={[0]}
                        max={100}
                        step={1}
                        onValueChange={handleUnlock}
                        className="w-full"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => setShowPasswordInput(true)}
                      className="w-full text-white/60 hover:text-white hover:bg-white/10
                        transition-all duration-200 rounded-xl py-2"
                    >
                      使用密码解锁
                    </Button>
                  </div>
                </div>
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
              <motion.div
                animate={{ rotate: isNotificationExpanded ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <ChevronDownIcon className="w-5 h-5 text-white/80" />
              </motion.div>
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
                    className={`
                      backdrop-blur-sm rounded-xl p-4 border
                      transition-all duration-200
                      hover:bg-white/5
                      ${
                        notification.level === "error"
                          ? "bg-red-500/10 border-red-500/30 hover:border-red-500/50"
                          : notification.level === "warn"
                          ? "bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50"
                          : "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50"
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`
                        w-8 h-8 rounded-full flex-shrink-0
                        flex items-center justify-center
                        ${
                          notification.level === "error"
                            ? "bg-red-500/20"
                            : notification.level === "warn"
                            ? "bg-yellow-500/20"
                            : "bg-emerald-500/20"
                        }
                      `}
                      >
                        {notification.level === "error" ? (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        ) : notification.level === "warn" ? (
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <Info className="w-4 h-4 text-emerald-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-white">
                            {notification.id || "通知"}
                          </h4>
                          <time className="text-xs text-white/50">
                            {Math.floor(
                              (Date.now() -
                                (notification.timestamp as unknown as number)) /
                                60000
                            )}
                            分钟前
                          </time>
                        </div>
                        <p className="text-sm text-white/80 line-clamp-2">
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
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 mt-6">
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-3 gap-3"
            >
              {[
                {
                  icon: <Camera className="w-5 h-5" />,
                  action: () => handleQuickLaunch("CameraControl"),
                  label: "相机控制",
                  color: "from-purple-500/20 to-blue-500/20",
                  borderColor: "border-purple-500/30",
                  iconColor: "text-purple-400",
                },
                {
                  icon: <Compass className="w-5 h-5" />,
                  action: () => handleQuickLaunch("MountControl"),
                  label: "赤道仪控制",
                  color: "from-blue-500/20 to-cyan-500/20",
                  borderColor: "border-blue-500/30",
                  iconColor: "text-blue-400",
                },
                {
                  icon: <CloudMoonIcon className="w-5 h-5" />,
                  action: () => handleQuickLaunch("WeatherMonitor"),
                  label: "天气监测",
                  color: "from-emerald-500/20 to-teal-500/20",
                  borderColor: "border-emerald-500/30",
                  iconColor: "text-emerald-400",
                },
                {
                  icon: <Star className="w-5 h-5" />,
                  action: () => handleQuickLaunch("PolarAlignment"),
                  label: "极轴校准",
                  color: "from-yellow-500/20 to-orange-500/20",
                  borderColor: "border-yellow-500/30",
                  iconColor: "text-yellow-400",
                },
                {
                  icon: <SettingsIcon className="w-5 h-5" />,
                  action: () => handleQuickLaunch("Settings"),
                  label: "系统设置",
                  color: "from-gray-500/20 to-slate-500/20",
                  borderColor: "border-gray-500/30",
                  iconColor: "text-gray-400",
                },
              ].map((item, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={item.action}
                  className={`
                    relative group flex flex-col items-center justify-center
                    p-3 rounded-xl border backdrop-blur-sm
                    bg-gradient-to-br transition-all duration-300
                    hover:bg-opacity-100 hover:border-opacity-75
                    ${item.color} ${item.borderColor}
                  `}
                >
                  <div
                    className={`mb-2 transition-colors duration-200 ${item.iconColor} group-hover:text-white`}
                  >
                    {item.icon}
                  </div>
                  <span className="text-xs font-medium text-white/60 group-hover:text-white">
                    {item.label}
                  </span>
                </motion.button>
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}

      <audio ref={audioRef} src="/path-to-your-audio-file.mp3" />
    </motion.div>
  );
}
