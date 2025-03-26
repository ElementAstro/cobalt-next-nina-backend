"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useLockScreenStore } from "./lock-screen-types";
import { Label } from "@/components/ui/label";
import { useWeatherStore } from "@/stores/weatherStore";
import { useCameraStore } from "@/stores/cameraStore";
import { useLogStore } from "@/stores/logStore";
import { TimeDisplay } from "./TimeDisplay";
import { UnlockControls } from "./UnlockControls";
import { NotificationsPanel } from "./NotificationsPanel";
import { QuickLaunch } from "./QuickLaunch";
import { WeatherInfo } from "./WeatherInfo";
import { containerVariants, backdropVariants } from "./lock-screen-animations";

export default function LockScreen({
  backgroundImage = "/placeholder.svg?height=1080&width=1920",
  minimalMode = false,
  minimalModeConfig = {
    showTime: true,
    showWeather: true,
    showNotifications: true,
    showMusicControls: true,
    showQuickLaunch: true,
    showStatusIndicators: true,
  },
  inactivityTimeout = 60000,
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { setIsLocked, updateLastActivityTime } = useLockScreenStore();
  const [isDarkMode] = useState(false);
  const [isNotificationExpanded, setIsNotificationExpanded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lockTimeout = useRef<NodeJS.Timeout | null>(null);

  // 从 store 获取天气、设备状态以及通知日志
  const weatherStore = useWeatherStore();
  const cameraStore = useCameraStore();
  const logStore = useLogStore();

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
      {/* 背景遮罩层 */}
      <motion.div
        {...backdropVariants}
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
            <TimeDisplay currentTime={currentTime} />

            {/* 天气信息：仅当 weatherStore 已连接且有数据时显示 */}
            {weatherStore.isConnected &&
              weatherStore.temperature &&
              minimalModeConfig.showWeather && <WeatherInfo />}
          </div>

          {/* 状态指示器：显示设备状态，仅当 cameraStore 已连接时显示 */}
          {cameraStore.isConnected &&
            minimalModeConfig.showStatusIndicators && (
              <motion.div className="flex items-center gap-2 mt-2 text-sm">
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
          <UnlockControls resetInactivityTimeout={resetInactivityTimeout} />
        </motion.div>
      )}

      {/* 右侧: 通知 */}
      {minimalModeConfig.showNotifications && logStore.logs.length > 0 && (
        <motion.div
          variants={containerVariants}
          className="z-10 w-full md:w-1/3 p-4 flex flex-col justify-center"
        >
          <NotificationsPanel
            logs={logStore.logs}
            isExpanded={isNotificationExpanded}
            onToggle={toggleNotifications}
          />

          {/* 快速启动部分 */}
          {minimalModeConfig.showQuickLaunch && <QuickLaunch />}
        </motion.div>
      )}

      <audio ref={audioRef} src="/path-to-your-audio-file.mp3" />
    </motion.div>
  );
}
