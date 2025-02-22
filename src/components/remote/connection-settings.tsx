"use client";

import React from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Network, Lock, AlertCircle } from "lucide-react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z.object({
  host: z
    .string()
    .min(1, "主机地址不能为空")
    .regex(/^[\w.-]+$/, "主机地址格式不正确"),
  port: z
    .string()
    .regex(/^\d+$/, "端口必须为数字")
    .refine((val) => {
      const port = parseInt(val);
      return port >= 1 && port <= 65535;
    }, "端口范围必须在 1-65535 之间"),
  password: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ConnectionSettingsProps {
  host: string;
  port: string;
  password: string;
  isConnected: boolean;
  setHost: (value: string) => void;
  setPort: (value: string) => void;
  setPassword: (value: string) => void;
  onSubmit?: (data: FormData) => void;
  className?: string;
}

const ConnectionSettings: React.FC<ConnectionSettingsProps> = ({
  host,
  port,
  password,
  isConnected,
  setHost,
  setPort,
  setPassword,
  onSubmit,
  className,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      host,
      port,
      password,
    },
  });

  const handleFormSubmit = handleSubmit((data) => {
    setHost(data.host);
    setPort(data.port);
    setPassword(data.password || "");
    onSubmit?.(data);
  });

  const inputVariants = {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
  };

  return (
    <motion.form
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn("space-y-6", className)}
      onSubmit={handleFormSubmit}
    >
      <motion.div
        variants={inputVariants}
        transition={{ duration: 0.3 }}
        className="space-y-2"
      >
        <Label
          htmlFor="host"
          className={cn(
            "flex items-center gap-2 text-sm font-medium",
            errors.host && "text-destructive"
          )}
        >
          <Network className="h-4 w-4" />
          VNC 主机
        </Label>
        <div className="relative">
          <Input
            id="host"
            {...register("host")}
            type="text"
            placeholder="例如: localhost 或 192.168.1.100"
            disabled={isConnected}
            className={cn(
              "pl-4 pr-10",
              "transition-all duration-200",
              "border-gray-700/50 dark:border-gray-600/50",
              "bg-background/95 backdrop-blur-sm",
              "placeholder:text-muted-foreground/50",
              isConnected && "opacity-50 cursor-not-allowed",
              errors.host && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {errors.host && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
          )}
        </div>
        {errors.host && (
          <p className="text-sm text-destructive">{errors.host.message}</p>
        )}
      </motion.div>

      <motion.div
        variants={inputVariants}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="space-y-2"
      >
        <Label
          htmlFor="port"
          className={cn(
            "flex items-center gap-2 text-sm font-medium",
            errors.port && "text-destructive"
          )}
        >
          <Network className="h-4 w-4" />
          VNC 端口
        </Label>
        <div className="relative">
          <Input
            id="port"
            {...register("port")}
            type="text"
            placeholder="例如: 5900"
            disabled={isConnected}
            className={cn(
              "pl-4 pr-10",
              "transition-all duration-200",
              "border-gray-700/50 dark:border-gray-600/50",
              "bg-background/95 backdrop-blur-sm",
              "placeholder:text-muted-foreground/50",
              isConnected && "opacity-50 cursor-not-allowed",
              errors.port && "border-destructive focus-visible:ring-destructive"
            )}
          />
          {errors.port && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
          )}
        </div>
        {errors.port && (
          <p className="text-sm text-destructive">{errors.port.message}</p>
        )}
      </motion.div>

      <motion.div
        variants={inputVariants}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="space-y-2"
      >
        <Label
          htmlFor="password"
          className="flex items-center gap-2 text-sm font-medium"
        >
          <Lock className="h-4 w-4" />
          密码 (可选)
        </Label>
        <div className="relative">
          <Input
            id="password"
            {...register("password")}
            type="password"
            placeholder="输入 VNC 密码"
            disabled={isConnected}
            className={cn(
              "pl-4 pr-10",
              "transition-all duration-200",
              "border-gray-700/50 dark:border-gray-600/50",
              "bg-background/95 backdrop-blur-sm",
              "placeholder:text-muted-foreground/50",
              isConnected && "opacity-50 cursor-not-allowed"
            )}
          />
        </div>
      </motion.div>

      {onSubmit && (
        <motion.div
          variants={inputVariants}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Button
            type="submit"
            disabled={isConnected}
            className="w-full"
            variant="outline"
          >
            保存设置
          </Button>
        </motion.div>
      )}
    </motion.form>
  );
};

export default ConnectionSettings;
