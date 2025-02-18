"use client";

import { useForm, Controller } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useDnsmasqStore, DnsmasqConfig } from "@/stores/extra/dnsmasq";
import { Variants } from "framer-motion";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Server,
  Settings,
  ChevronDown,
  ChevronUp,
  Network,
  HardDrive,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import React from "react";

// Zod schema for validation
const dnsmasqSchema = z.object({
  listenAddress: z.string().ip(),
  port: z.string().regex(/^\d+$/).transform(Number),
  dnsServers: z
    .string()
    .regex(
      /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(,\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})*$/
    ),
  cacheSize: z.string().regex(/^\d+$/).transform(Number),
  domainNeeded: z.boolean(),
  bogusPriv: z.boolean(),
  expandHosts: z.boolean(),
  noCacheNegative: z.boolean(),
  strictOrder: z.boolean(),
  noHosts: z.boolean(),
});

export const fadeInOut: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const slideUpDown: Variants = {
  initial: { y: 20, opacity: 0, scale: 0.98 },
  animate: { y: 0, opacity: 1, scale: 1 },
  exit: { y: -20, opacity: 0, scale: 0.98 },
};

export const staggerChildren: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

export const rotateChevron: Variants = {
  initial: { rotate: 0 },
  animate: { rotate: 180 },
};

const springTransition = {
  type: "spring",
  stiffness: 300,
  damping: 20,
};

const formFields = [
  {
    name: "listenAddress",
    label: "Listen Address",
    type: "text",
    icon: Server as React.ElementType,
    description: "The IP address to listen on",
  },
  {
    name: "port",
    label: "Port",
    type: "text",
    icon: Network as React.ElementType,
    description: "The port to listen on (default: 53)",
  },
  {
    name: "dnsServers",
    label: "DNS Servers",
    type: "text",
    icon: Server,
    description: "Comma separated list of upstream DNS servers",
  },
  {
    name: "cacheSize",
    label: "Cache Size",
    type: "text",
    icon: HardDrive as React.ElementType,
    description: "Maximum number of cached DNS entries",
  },
  {
    name: "domainNeeded",
    label: "Domain Needed",
    type: "checkbox",
    description: "Never forward plain names (without a dot or domain part)",
  },
  {
    name: "bogusPriv",
    label: "Bogus Priv",
    type: "checkbox",
    description: "Do not forward reverse lookups for private ranges",
  },
  {
    name: "expandHosts",
    label: "Expand Hosts",
    type: "checkbox",
    description: "Add the domain to simple names in /etc/hosts",
  },
  {
    name: "noCacheNegative",
    label: "No Cache Negative",
    type: "checkbox",
    description: "Do not cache negative (NXDOMAIN) responses",
  },
  {
    name: "strictOrder",
    label: "Strict Order",
    type: "checkbox",
    description: "Query DNS servers in strict order",
  },
  {
    name: "noHosts",
    label: "No Hosts",
    type: "checkbox",
    description: "Do not read /etc/hosts file",
  },
];

export function DnsmasqConfigPanel() {
  const { config, isAdvancedOpen, updateConfig, toggleAdvanced, saveConfig } =
    useDnsmasqStore();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DnsmasqConfig>({
    defaultValues: config,
    resolver: zodResolver(dnsmasqSchema),
  });

  const onSubmit = async (data: DnsmasqConfig) => {
    try {
      updateConfig(data);
      await saveConfig();
      toast({
        title: "Configuration Saved",
        description: "Your dnsmasq configuration has been updated.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error Saving Configuration",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full p-4 flex flex-col min-h-screen">
      <motion.div
        className="flex-1 w-full max-w-2xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Card className="h-full flex flex-col">
          <CardHeader className="flex-none space-y-2 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="w-5 h-5" />
              <span>Dnsmasq 配置</span>
            </CardTitle>
            <CardDescription className="text-sm">
              配置本地 DNS 和 DHCP 服务器设置
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <motion.div
                variants={staggerChildren}
                initial="initial"
                animate="animate"
                className="grid gap-4"
              >
                {/* 基本设置部分 */}
                <div className="space-y-3">
                  {formFields.slice(0, 4).map((field) => (
                    <motion.div
                      key={field.name}
                      variants={fadeInOut}
                      className="space-y-1.5"
                    >
                      <div className="flex items-center gap-1.5">
                        {field.icon && (
                          <span className="p-1 rounded-md bg-muted">
                            {React.createElement(field.icon, {
                              className: "w-3.5 h-3.5 text-muted-foreground",
                            })}
                          </span>
                        )}
                        <Label
                          htmlFor={field.name}
                          className="text-sm font-medium flex items-center gap-1.5"
                        >
                          {field.label}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="cursor-help">
                                <Info className="w-3.5 h-3.5 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent
                                side="right"
                                className="max-w-[200px]"
                              >
                                <p className="text-xs">{field.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Label>
                      </div>

                      <Controller
                        name={field.name as keyof DnsmasqConfig}
                        control={control}
                        rules={{ required: true }}
                        render={({ field: { value, ...fieldProps } }) => (
                          <div className="relative">
                            <Input
                              {...fieldProps}
                              id={field.name}
                              value={String(value)}
                              className={cn(
                                "w-full h-9 text-sm",
                                errors[field.name as keyof DnsmasqConfig] &&
                                  "border-red-500 focus:border-red-500"
                              )}
                              placeholder={`输入${field.label}...`}
                            />
                          </div>
                        )}
                      />

                      {errors[field.name as keyof DnsmasqConfig] && (
                        <p className="text-xs text-red-500">
                          {errors[field.name as keyof DnsmasqConfig]?.message}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* 高级选项按钮 */}
                <div className="pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={toggleAdvanced}
                    className="w-full h-9 justify-between hover:bg-accent/10"
                  >
                    <span className="text-sm font-medium">高级选项</span>
                    <motion.span
                      variants={rotateChevron}
                      animate={isAdvancedOpen ? "animate" : "initial"}
                      transition={springTransition}
                    >
                      {isAdvancedOpen ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </motion.span>
                  </Button>
                </div>

                {/* 高级选项内容 */}
                <AnimatePresence>
                  {isAdvancedOpen && (
                    <motion.div
                      variants={slideUpDown}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={springTransition}
                      className="space-y-2"
                    >
                      {formFields.slice(4).map((field) => (
                        <motion.div
                          key={field.name}
                          variants={fadeInOut}
                          className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent/5"
                        >
                          <Controller
                            name={field.name as keyof DnsmasqConfig}
                            control={control}
                            render={({ field: { onChange, value } }) => (
                              <Checkbox
                                id={field.name}
                                checked={value as boolean}
                                onCheckedChange={onChange}
                                className="mt-1 h-4 w-4"
                              />
                            )}
                          />
                          <div className="space-y-0.5 flex-1">
                            <Label
                              htmlFor={field.name}
                              className="text-sm font-medium"
                            >
                              {field.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {field.description}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* 提交按钮 */}
              <Button
                type="submit"
                className="w-full h-9 text-sm font-medium mt-4"
              >
                保存配置
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
