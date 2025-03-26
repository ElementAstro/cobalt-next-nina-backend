import { motion } from "framer-motion";
import { useMemo } from "react";

interface FocusPointProps {
  x: number;
  y: number;
  active?: boolean;
  onFocus?: () => void;
}

export function FocusPoint({ x, y, active = false, onFocus }: FocusPointProps) {
  const variants = useMemo(() => ({
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: active ? 1.2 : 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30
      }
    },
    exit: { scale: 0, opacity: 0 }
  }), [active]);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants}
      className="absolute w-4 h-4 rounded-full cursor-pointer"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
      }}
      onClick={onFocus}
      aria-label={`Focus point at ${x}%, ${y}%`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onFocus?.()}
    >
      <div className={`
        absolute inset-0 rounded-full border-2
        ${active ? "border-red-500 bg-red-500/20" : "border-white/80"}
        transition-colors duration-200
      `} />
      {active && (
        <div className="
          absolute inset-0 rounded-full
          animate-pulse border-2 border-red-500
        " />
      )}
    </motion.div>
  );
}
