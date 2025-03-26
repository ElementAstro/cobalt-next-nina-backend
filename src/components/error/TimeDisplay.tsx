"use client";

import { motion } from "framer-motion";
import { itemVariants } from "./lock-screen-animations";

interface TimeDisplayProps {
  currentTime: Date;
}

export function TimeDisplay({ currentTime }: TimeDisplayProps) {
  return (
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
  );
}