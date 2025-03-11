import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface LoadingAnimationProps {
  progress: number;
}

export function LoadingAnimation({ progress }: LoadingAnimationProps) {
  // 用于平滑进度条动画的状态
  const [displayProgress, setDisplayProgress] = useState(0);

  // 平滑进度值变化
  useEffect(() => {
    // 使用 requestAnimationFrame 实现更平滑的进度更新
    let animationFrameId: number;
    let startTimestamp: number | null = null;
    const duration = 300; // 动画持续时间 (ms)

    const animateProgress = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsedTime = timestamp - startTimestamp;
      const progressFactor = Math.min(elapsedTime / duration, 1);

      // 使用缓动函数使动画更平滑
      const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
      const smoothedProgress =
        displayProgress +
        (progress - displayProgress) * easeOutCubic(progressFactor);

      setDisplayProgress(smoothedProgress);

      if (progressFactor < 1) {
        animationFrameId = requestAnimationFrame(animateProgress);
      }
    };

    animationFrameId = requestAnimationFrame(animateProgress);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [progress, displayProgress]);

  // 改进的3D立方体动画
  const cubeVariants = {
    hidden: { rotateX: 0, rotateY: 0, opacity: 0 },
    visible: {
      rotateX: [0, 180, 360],
      rotateY: [0, 180, 360],
      opacity: 1,
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "linear",
        times: [0, 0.5, 1],
      },
    },
  };

  // 增强的进度环动画
  const progressRingVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: displayProgress / 100,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: [0.34, 1.56, 0.64, 1], // 弹性缓动效果
      },
    },
  };

  // 改进的轨迹发光效果
  const trailVariants = {
    hidden: { opacity: 0, pathLength: 0 },
    visible: {
      opacity: [0.2, 0.6, 0.2],
      pathLength: 1,
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
        times: [0, 0.5, 1],
      },
    },
  };

  // 数字动画效果
  const numberVariants = {
    initial: { opacity: 0, y: 10, scale: 0.9 },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.9,
      transition: {
        duration: 0.3,
        ease: "easeIn",
      },
    },
  };

  // 粒子效果
  const particleVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: (i: number) => ({
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      x: [0, (i % 2 === 0 ? 1 : -1) * Math.random() * 50],
      y: [0, -Math.random() * 50],
      transition: {
        duration: 1.5 + Math.random(),
        repeat: Infinity,
        delay: Math.random() * 2,
      },
    }),
  };

  // 生成粒子
  const particles = Array.from({ length: 8 }, (_, i) => (
    <motion.div
      key={i}
      custom={i}
      variants={particleVariants}
      initial="hidden"
      animate="visible"
      className="absolute w-1.5 h-1.5 rounded-full bg-blue-400"
      style={{
        left: "calc(50% - 3px)",
        top: "calc(50% - 3px)",
        filter: "blur(1px)",
      }}
    />
  ));

  return (
    <div className="relative w-full h-64 flex items-center justify-center transform-gpu">
      {/* 改进的背景发光效果 */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur-3xl"
        animate={{
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative">
        {/* 3D立方体动画 - 增强版 */}
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
          variants={cubeVariants}
          initial="hidden"
          animate="visible"
          style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
        >
          <div className="w-20 h-20 relative">
            {/* 立方体的所有面 */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg shadow-2xl shadow-blue-500/50"
              style={{
                transformStyle: "preserve-3d",
                backfaceVisibility: "hidden",
                filter: "brightness(1.2)",
              }}
              animate={{
                boxShadow: [
                  "0 0 15px 2px rgba(59, 130, 246, 0.4)",
                  "0 0 25px 5px rgba(59, 130, 246, 0.6)",
                  "0 0 15px 2px rgba(59, 130, 246, 0.4)",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </motion.div>

        {/* 粒子效果 */}
        {particles}

        {/* 优化的进度环 */}
        <svg className="w-64 h-64 -rotate-90" viewBox="0 0 100 100">
          <defs>
            <linearGradient
              id="progressGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="50%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feFlood floodColor="#3B82F6" floodOpacity="0.6" />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            {/* 添加更强的发光效果 */}
            <filter id="strongerGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feFlood floodColor="#60A5FA" floodOpacity="0.8" />
              <feComposite in2="blur" operator="in" />
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 背景圆环 */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(59, 130, 246, 0.1)"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* 进度环 */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            variants={progressRingVariants}
            initial="hidden"
            animate="visible"
            style={{
              filter: "url(#glow)",
            }}
          />

          {/* 轨迹发光效果 */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray="5 20"
            variants={trailVariants}
            initial="hidden"
            animate="visible"
            style={{
              filter: "url(#strongerGlow)",
            }}
          />
        </svg>

        {/* 进度文字 - 改进动画 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <AnimatePresence mode="wait">
            <motion.div
              key={Math.round(displayProgress)}
              variants={numberVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-col items-center"
            >
              <motion.span
                className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400"
                style={{
                  textShadow: "0 0 30px rgba(59, 130, 246, 0.7)",
                }}
              >
                {Math.round(displayProgress)}%
              </motion.span>
              <motion.span
                className="text-sm text-blue-300 mt-2 opacity-80 tracking-wider"
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                正在加载...
              </motion.span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
