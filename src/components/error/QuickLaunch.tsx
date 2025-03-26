"use client";

import { motion } from "framer-motion";
import { Camera, Compass, CloudMoonIcon, Star, SettingsIcon } from "lucide-react";
import { useRouter } from "next/router";
import { itemVariants } from "./lock-screen-animations";

export function QuickLaunch() {
  const router = useRouter();

  const handleQuickLaunch = (app: string) => {
    router.push(`/${app}`);
  };

  return (
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
  );
}