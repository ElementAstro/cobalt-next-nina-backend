import { useMemo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type GridType = "rule-of-thirds" | "golden-ratio" | "square" | "diagonal";

interface GridOverlayProps {
  type: GridType;
  color?: string;
  opacity?: number;
  customDivisions?: number;
  duration?: number;
}

export function GridOverlay({
  type,
  color = "white",
  opacity = 0.2,
  customDivisions = 3,
  duration = 300,
}: GridOverlayProps) {
  const [loaded, setLoaded] = useState(false);
  const gridStyle = useMemo(
    () => ({
      borderColor: color,
      opacity,
    }),
    [color, opacity]
  );

  useEffect(() => {
    setLoaded(true);
    return () => setLoaded(false);
  }, []);

  const renderGrid = () => {
    switch (type) {
      case "rule-of-thirds":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration / 1000 }}
            className="absolute inset-0 grid grid-cols-3 grid-rows-3"
          >
            {Array(4)
              .fill(null)
              .map((_, i) => (
                <motion.div
                  key={i}
                  className={`bg-white/20 ${i < 2 ? "border-r" : "border-b"}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05, duration: 0.2 }}
                />
              ))}
          </motion.div>
        );
      case "golden-ratio":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration / 1000 }}
            className="absolute inset-0"
          >
            <motion.div
              className="w-full h-full border-[1px] border-white/20"
              style={{ borderWidth: "38.2%" }}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            />
            <motion.div
              className="w-full h-full border-[1px] border-white/20"
              style={{ borderWidth: "61.8%" }}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
            />
          </motion.div>
        );
      case "square":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration / 1000 }}
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${customDivisions}, 1fr)`,
              gridTemplateRows: `repeat(${customDivisions}, 1fr)`,
            }}
          >
            {Array(customDivisions * customDivisions)
              .fill(null)
              .map((_, i) => (
                <motion.div
                  key={i}
                  className="border"
                  style={gridStyle}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: (i % customDivisions) * 0.05 }}
                />
              ))}
          </motion.div>
        );
      case "diagonal":
        return (
          <motion.svg
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration / 1000 }}
            className="absolute inset-0 w-full h-full stroke-current"
            style={gridStyle}
          >
            <motion.line
              x1="0"
              y1="0"
              x2="100%"
              y2="100%"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
            />
            <motion.line
              x1="100%"
              y1="0"
              x2="0"
              y2="100%"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </motion.svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <AnimatePresence mode="wait">
        {loaded && renderGrid()}
      </AnimatePresence>
    </div>
  );
}
