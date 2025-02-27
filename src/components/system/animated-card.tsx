"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import useSystemStore from "@/stores/system/systemStore";
import { ReactNode, HTMLAttributes } from "react";

const animations = {
  slow: { duration: 0.8, ease: "easeInOut" },
  normal: { duration: 0.5, ease: "easeOut" },
  fast: { duration: 0.3, ease: "easeOut" },
};

interface AnimatedCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export default function AnimatedCard({
  children,
  className,
  ...props
}: AnimatedCardProps) {
  const { settings } = useSystemStore();
  const speed = settings.animationSpeed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={animations[speed]}
      whileHover={{ scale: 1.01 }}
      layout
    >
      <Card className={className} {...props}>
        {children}
      </Card>
    </motion.div>
  );
}
