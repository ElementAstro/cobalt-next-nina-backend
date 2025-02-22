"use client";

import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { UseFormReturn } from "react-hook-form";
import { Server, Wifi, Lock } from "lucide-react";
import { ConnectionFormData } from "@/app/connection/page";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ConnectionDetailsProps {
  form: UseFormReturn<ConnectionFormData>;
  isSSL: boolean;
  setIsSSL: (value: boolean) => void;
  disabled?: boolean;
}

export function ConnectionDetails({
  form,
  isSSL,
  setIsSSL,
  disabled = false,
}: ConnectionDetailsProps) {
  const inputVariants = {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <motion.div
          variants={inputVariants}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.2 }}
        >
          <FormField
            control={form.control}
            name="ip"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="flex items-center gap-2 text-sm font-medium">
                  <Server className="w-4 h-4 text-muted-foreground" />
                  服务器地址
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="输入IP地址或域名"
                      {...field}
                      className={cn(
                        "h-9 pl-9 transition-shadow focus-visible:ring-primary",
                        disabled && "opacity-50 cursor-not-allowed"
                      )}
                      disabled={disabled}
                    />
                    <Wifi className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  </div>
                </FormControl>
                <FormDescription className="text-xs">
                  输入您要连接的设备地址
                </FormDescription>
                <FormMessage className="text-xs" />
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
            name="port"
            render={({ field: { onChange, ...field } }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  连接端口
                </FormLabel>
                <div className="flex items-center gap-3">
                  <FormControl>
                    <Input
                      type="number"
                      className={cn(
                        "w-28 h-9 font-mono transition-shadow focus-visible:ring-primary",
                        disabled && "opacity-50 cursor-not-allowed"
                      )}
                      placeholder="端口"
                      onChange={(e) => onChange(Number(e.target.value))}
                      {...field}
                      disabled={disabled}
                    />
                  </FormControl>
                  <div className="flex items-center gap-2 ml-2">
                    <Checkbox
                      id="ssl"
                      checked={isSSL}
                      onCheckedChange={setIsSSL}
                      disabled={disabled}
                      className={cn(
                        "w-4 h-4 transition-shadow data-[state=checked]:bg-primary",
                        disabled && "opacity-50 cursor-not-allowed"
                      )}
                    />
                    <Label
                      htmlFor="ssl"
                      className={cn(
                        "text-sm cursor-pointer select-none",
                        disabled && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      SSL加密
                    </Label>
                  </div>
                </div>
                <FormDescription className="text-xs">
                  {isSSL ? "使用SSL加密连接" : "使用标准连接"}
                </FormDescription>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="text-sm text-muted-foreground"
      >
        <p>确保输入正确的服务器地址和端口以建立连接</p>
      </motion.div>
    </motion.div>
  );
}
