"use client";

import { motion } from "framer-motion";
import { SunIcon, ThermometerIcon, Wind } from "lucide-react";
import { useWeatherStore } from "@/stores/weatherStore";
import { itemVariants } from "./lock-screen-animations";

export function WeatherInfo() {
  const weatherStore = useWeatherStore();

  if (!weatherStore.isConnected || !weatherStore.temperature) {
    return null;
  }

  return (
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
  );
}