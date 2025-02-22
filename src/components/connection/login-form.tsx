"use client";

import React from "react";
import {
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormLabel,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, User, Lock, AlertTriangle } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { ConnectionFormData } from "@/app/connection/page";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface LoginFormProps {
  form: UseFormReturn<ConnectionFormData>;
  showPassword: boolean;
  togglePasswordVisibility: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function LoginForm({
  form,
  showPassword,
  togglePasswordVisibility,
  isLoading = false,
  disabled = false,
}: LoginFormProps) {
  const inputVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  const errorVariants = {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: "auto" },
    exit: { opacity: 0, height: 0 },
  };

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          variants={inputVariants}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.2 }}
        >
          <FormField
            control={form.control}
            name="username"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm font-medium">
                  <User className="w-4 h-4 text-muted-foreground" />
                  用户名
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="输入用户名"
                      className={cn(
                        "h-9 transition-all",
                        fieldState.error && "border-red-500 focus-visible:ring-red-500",
                        disabled && "opacity-50 cursor-not-allowed"
                      )}
                      {...field}
                      disabled={disabled || isLoading}
                    />
                    <AnimatePresence>
                      {fieldState.error && (
                        <motion.div
                          variants={errorVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                        >
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </FormControl>
                <AnimatePresence>
                  {fieldState.error && (
                    <motion.div
                      variants={errorVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <FormMessage className="text-xs mt-1" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <FormDescription className="text-xs mt-1">
                  输入您的设备用户名
                </FormDescription>
              </FormItem>
            )}
          />
        </motion.div>

        <motion.div
          variants={inputVariants}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <FormField
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  密码
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="输入密码"
                      className={cn(
                        "h-9 pr-10 transition-all",
                        fieldState.error && "border-red-500 focus-visible:ring-red-500",
                        disabled && "opacity-50 cursor-not-allowed"
                      )}
                      {...field}
                      disabled={disabled || isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "absolute right-0 top-0 h-9 w-9 text-muted-foreground hover:text-foreground",
                        disabled && "opacity-50 cursor-not-allowed"
                      )}
                      onClick={togglePasswordVisibility}
                      disabled={disabled || isLoading}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={showPassword ? "show" : "hide"}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </motion.div>
                      </AnimatePresence>
                    </Button>
                    <AnimatePresence>
                      {fieldState.error && (
                        <motion.div
                          variants={errorVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          className="absolute right-10 top-1/2 -translate-y-1/2"
                        >
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </FormControl>
                <AnimatePresence>
                  {fieldState.error && (
                    <motion.div
                      variants={errorVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <FormMessage className="text-xs mt-1" />
                    </motion.div>
                  )}
                </AnimatePresence>
                <FormDescription className="text-xs mt-1">
                  输入您的设备密码
                </FormDescription>
              </FormItem>
            )}
          />
        </motion.div>
      </div>

      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground text-center"
        >
          正在验证登录信息...
        </motion.div>
      )}
    </motion.div>
  );
}
