"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LockIcon, KeyIcon, FingerprintIcon, ChevronLeft } from "lucide-react";
import { useLockScreenStore } from "./lock-screen-types";
import { itemVariants, containerVariants } from "./lock-screen-animations";

interface UnlockControlsProps {
  resetInactivityTimeout: () => void;
}

export function UnlockControls({ resetInactivityTimeout }: UnlockControlsProps) {
  const [password, setPassword] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const { setIsLocked } = useLockScreenStore();

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "1234") {
      setIsLocked(false);
      resetInactivityTimeout();
    } else {
      alert("密码错误，请重试");
      setPassword("");
    }
  };

  const handleBiometricAuth = () => {
    alert("生物识别认证成功");
    setIsLocked(false);
    resetInactivityTimeout();
  };

  const handleUnlock = (value: number[]) => {
    if (value[0] === 100) {
      setIsLocked(false);
      resetInactivityTimeout();
    }
  };

  return (
    <AnimatePresence>
      {showPasswordInput ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="max-w-sm mx-auto w-full"
        >
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
              <KeyIcon className="w-6 h-6 text-white/80" />
              <h2 className="text-lg font-medium text-white/80">
                请输入密码
              </h2>
            </div>

            <motion.form
              onSubmit={handlePasswordSubmit}
              className="space-y-4"
              variants={itemVariants}
            >
              <div className="relative">
                <Input
                  type="password"
                  placeholder="输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 text-lg bg-white/10 border-white/20 rounded-xl pl-12
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200"
                />
                <LockIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="submit"
                  className="h-12 bg-blue-500/90 hover:bg-blue-500 text-white
                    rounded-xl shadow-lg shadow-blue-500/20
                    transition-all duration-200 hover:scale-105"
                >
                  确认解锁
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowPasswordInput(false)}
                  className="h-12 border border-white/20 text-white hover:bg-white/10
                    rounded-xl backdrop-blur-sm
                    transition-all duration-200 hover:scale-105
                    flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  返回
                </Button>
              </div>
            </motion.form>

            <div className="mt-4 pt-4 border-t border-white/10">
              <Button
                variant="ghost"
                onClick={handleBiometricAuth}
                className="w-full text-white/60 hover:text-white hover:bg-white/10
                  transition-all duration-200 rounded-xl h-12
                  flex items-center justify-center gap-2"
              >
                <FingerprintIcon className="w-5 h-5" />
                使用生物识别
              </Button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          variants={itemVariants}
          className="max-w-sm mx-auto w-full space-y-4"
        >
          <div className="relative">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl">
              <div className="mb-4">
                <motion.div
                  className="flex justify-center items-center gap-3 mb-4"
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <LockIcon className="w-6 h-6 text-white/80" />
                  <span className="text-lg font-medium text-white/80">
                    向右滑动解锁
                  </span>
                </motion.div>
                <Slider
                  defaultValue={[0]}
                  max={100}
                  step={1}
                  onValueChange={handleUnlock}
                  className="w-full"
                />
              </div>
              <Button
                variant="ghost"
                onClick={() => setShowPasswordInput(true)}
                className="w-full text-white/60 hover:text-white hover:bg-white/10
                  transition-all duration-200 rounded-xl py-2"
              >
                使用密码解锁
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}