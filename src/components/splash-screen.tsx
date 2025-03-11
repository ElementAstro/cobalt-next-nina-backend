"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoadingAnimation } from "./loading-animation";
import Image from "next/image";
import useMediaQuery from "react-responsive";

export default function SplashScreen() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const isLandscape = useMediaQuery({ query: "(orientation: landscape)" });

  // 优化进度条加载逻辑，使其更平滑
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3500);

    // 使用非线性的进度增长，开始快，接近100%时变慢
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        // 非线性增长：接近100时增长变慢
        const remaining = 100 - prev;
        const increment = Math.max(1, Math.floor(remaining * 0.15));
        return Math.min(99, prev + increment); // 确保不超过99，留给最后一步
      });
    }, 180);

    // 确保在接近结束时达到100%
    const finalProgressTimer = setTimeout(() => {
      setProgress(100);
    }, 3300);

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setLoading(false);
        observer.disconnect();
      }
    });

    const currentContentRef = contentRef.current;

    if (currentContentRef) {
      observer.observe(currentContentRef);
    }

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
      clearTimeout(finalProgressTimer);
      if (currentContentRef) {
        observer.unobserve(currentContentRef);
      }
    };
  }, []);

  // 优化退出动画的时间控制
  useEffect(() => {
    if (!loading) {
      const hideTimer = setTimeout(() => {
        setVisible(false);
      }, 1200); // 增加一点时间让退出动画完全显示

      return () => clearTimeout(hideTimer);
    }
  }, [loading]);

  // 改进的动画变体配置
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.25,
        when: "beforeChildren",
        duration: 0.7,
        ease: [0.22, 1, 0.36, 1], // 使用更平滑的贝塞尔曲线
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.8,
        ease: [0.65, 0, 0.35, 1], // 平滑的退出动画
        when: "afterChildren",
        staggerChildren: 0.1,
        staggerDirection: -1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 120,
        damping: 20,
      },
    },
    exit: {
      y: -20,
      opacity: 0,
      transition: {
        duration: 0.5,
        ease: [0.65, 0, 0.35, 1],
      },
    },
  };

  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0, rotate: -15 },
    visible: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
        delay: 0.2,
      },
    },
    exit: {
      scale: 1.1,
      opacity: 0,
      transition: {
        duration: 0.7,
        ease: "easeInOut",
      },
    },
  };

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-950"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          key="splash-container"
        >
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="splash"
                className={`relative z-10 flex ${
                  isLandscape
                    ? "lg:flex-row lg:items-center lg:gap-12"
                    : "flex-col items-center gap-8"
                } justify-center w-full max-w-4xl mx-auto px-6`}
                variants={containerVariants}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  transition: { duration: 0.5 },
                }}
              >
                <motion.div variants={logoVariants} className="relative">
                  <div className="absolute -inset-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse" />
                  <Image
                    src="/atom.png"
                    alt="Logo"
                    width={isLandscape ? 180 : 120}
                    height={isLandscape ? 180 : 120}
                    className="relative drop-shadow-[0_0_30px_rgba(59,130,246,0.5)] animate-float"
                    priority
                    style={{
                      animation: "float 6s ease-in-out infinite",
                    }}
                  />
                </motion.div>
                <motion.div
                  variants={itemVariants}
                  className="w-full max-w-md mx-auto"
                >
                  <LoadingAnimation progress={progress} />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                ref={contentRef}
                className="relative z-10 flex flex-col items-center justify-center w-full max-w-4xl mx-auto px-6 space-y-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.h1
                  variants={itemVariants}
                  className="text-4xl font-bold text-center md:text-5xl lg:text-6xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
                >
                  欢迎来到 Cobalt
                </motion.h1>
                <motion.p
                  variants={itemVariants}
                  className="mt-6 text-gray-300 text-center max-w-2xl text-lg leading-relaxed"
                >
                  探索无限可能，开启您的数字之旅
                </motion.p>
                <motion.div
                  variants={itemVariants}
                  className="mt-8 flex flex-wrap gap-4 justify-center"
                >
                  <motion.button
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:scale-105 transition-transform"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    开始探索
                  </motion.button>
                  <motion.button
                    className="px-6 py-2.5 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition-colors"
                    whileHover={{ backgroundColor: "rgba(55, 65, 81, 0.5)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    了解更多
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
