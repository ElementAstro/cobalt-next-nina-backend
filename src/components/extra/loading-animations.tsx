"use client";

import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

// Shimmer animation for loading states
export const shimmer = `
  before:absolute before:inset-0 before:-translate-x-full
  before:animate-[shimmer_2s_infinite]
  before:bg-gradient-to-r
  before:from-transparent before:via-white/10 before:to-transparent
`;

// Progress indicator animation variants
export const progressVariants = {
  track: {
    initial: { scaleX: 0, opacity: 0 },
    enter: { 
      scaleX: 1, 
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
    exit: {
      scaleX: 0,
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeIn",
      },
    },
  },
  indicator: {
    initial: { width: "0%" },
    animate: (value: number) => ({
      width: `${value}%`,
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      },
    }),
  },
};

// Loading icon animation
export const LoadingIcon = ({ icon, name, size = "w-16 h-16" }: { icon: string; name: string; size?: string }) => (
  <motion.div
    className={cn("relative", size)}
    initial={{ scale: 0.9, opacity: 0 }}
    animate={{ 
      scale: 1, 
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    }}
  >
    <motion.div
      className="absolute inset-0"
      animate={{ 
        scale: [1, 1.05, 1],
        opacity: [0.8, 1, 0.8],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <Image
        src={icon}
        alt={name}
        fill
        className="rounded-2xl shadow-lg"
        priority
        sizes="(max-width: 768px) 64px, 96px"
      />
    </motion.div>
    <motion.div
      className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent rounded-2xl"
      animate={{ 
        rotate: [0, 180, 360],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  </motion.div>
);

// Spinner with custom animation
export const Spinner = ({ className }: { className?: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    transition={{ duration: 0.2 }}
  >
    <Loader2 
      className={cn(
        "animate-spin",
        className
      )} 
    />
  </motion.div>
);

// Progress bar with animations
export const AnimatedProgress = ({ 
  value,
  className,
}: { 
  value: number;
  className?: string;
}) => (
  <motion.div
    variants={progressVariants.track}
    initial="initial"
    animate="enter"
    exit="exit"
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-primary/10",
      className
    )}
  >
    <motion.div
      className="absolute inset-y-0 left-0 bg-primary"
      variants={progressVariants.indicator}
      initial="initial"
      animate="animate"
      custom={value}
    />
    <motion.div
      className={cn(
        "absolute inset-0",
        shimmer
      )}
    />
  </motion.div>
);

// Fade transition component
export const FadeTransition = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    }}
    exit={{ 
      opacity: 0, 
      y: -10,
      transition: {
        duration: 0.3,
        ease: "easeIn",
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);