"use client";

import { useState, useEffect, memo } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { App } from "@/types/extra";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Plus,
  AlertCircle,
  FileText,
  CheckCircle,
  Info,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// 增强的表单验证规则
const formSchema = z.object({
  name: z
    .string()
    .min(2, "应用名称至少需要2个字符")
    .max(50, "应用名称不能超过50个字符")
    .regex(
      /^[-a-zA-Z0-9\s\-_]+$/,
      "名称只能包含中文、字母、数字、空格、-和_"
    ),
  category: z.enum(["microsoft", "system", "tools", "development", "media"], {
    required_error: "请选择应用类别",
  }),
  url: z
    .string()
    .url("请输入有效的URL")
    .refine((val) => val.startsWith("https://"), "必须使用HTTPS协议")
    .refine(
      (val) => {
        try {
          new URL(val);
          return true;
        } catch {
          return false;
        }
      },
      "URL格式无效"
    ),
  icon: z
    .string()
    .url("请输入有效的图标URL")
    .refine((val) => val.startsWith("https://"), "必须使用HTTPS协议")
    .refine(
      (val) => /\.(png|jpg|jpeg|svg|webp)$/i.test(val),
      "图标链接必须以.png、.jpg、.jpeg、.svg或.webp结尾"
    )
    .optional(),
  description: z
    .string()
    .max(200, "描述不能超过200个字符")
    .refine(
      (val) => !val.includes("<") && !val.includes(">"),
      "描述不能包含HTML标签"
    )
    .optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddAppDialogProps {
  onAddApp: (newApp: App) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// 表单字段验证状态指示器
const ValidationIndicator = memo(({ isValid, message }: { isValid: boolean; message: string }) => (
  <Tooltip>
    <TooltipTrigger>
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        className={cn(
          "p-1 rounded-full transition-colors",
          isValid ? "text-green-500" : "text-yellow-500"
        )}
      >
        {isValid ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <Info className="h-4 w-4" />
        )}
      </motion.div>
    </TooltipTrigger>
    <TooltipContent>{message}</TooltipContent>
  </Tooltip>
));

ValidationIndicator.displayName = "ValidationIndicator";

// 加载骨架屏
const FormSkeleton = memo(() => (
  <div className="space-y-4 animate-pulse">
    <Skeleton className="h-8 w-full" />
    <Skeleton className="h-8 w-3/4" />
    <Skeleton className="h-8 w-1/2" />
  </div>
));

FormSkeleton.displayName = "FormSkeleton";

export const AddAppDialog = memo(({ onAddApp, open, onOpenChange }: AddAppDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formProgress, setFormProgress] = useState(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      category: "tools",
      url: "https://",
      icon: "",
      description: "",
    },
    mode: "onChange", // 启用实时验证
  });

  const { formState: { isValid, dirtyFields, errors }, watch } = form;

  // 监视表单字段变化
  useEffect(() => {
    const subscription = watch((_, { type }) => {
      if (type === "change") {
        // 计算表单完成进度
        const requiredFields = ["name", "category", "url"];
        const completedFields = requiredFields.filter(
          (field) => dirtyFields[field as keyof typeof dirtyFields]
        );
        setFormProgress((completedFields.length / requiredFields.length) * 100);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, dirtyFields]);

  // 模拟表单加载
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      const newApp: App = {
        id: Date.now().toString(),
        name: values.name,
        category: values.category,
        isPinned: false,
        url: values.url,
        description: values.description || "",
        icon: values.icon || "/placeholder.svg?height=32&width=32",
      };
      await onAddApp(newApp);
      form.reset();
      
      if (onOpenChange) {
        onOpenChange(false);
      }

      toast({
        title: "添加成功",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>{values.name} 已成功添加到您的应用列表</span>
          </div>
        ),
      });
    } catch (error) {
      console.error("Failed to add app:", error);
      toast({
        title: "添加失败",
        description: (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span>添加应用时发生错误，请重试</span>
          </div>
        ),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryIcons = {
    microsoft: "M",
    system: "S",
    tools: "T", 
    development: "D",
    media: "M",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full sm:w-auto group",
            "hover:border-primary/50 hover:bg-primary/5",
            "transition-all duration-300"
          )}
        >
          <motion.div
            initial={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            className="mr-2"
          >
            <Plus className="h-4 w-4" />
          </motion.div>
          添加应用
        </Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "sm:max-w-[425px] p-6",
          "bg-background/95 backdrop-blur-md",
          "border border-primary/10",
          "shadow-xl shadow-primary/5",
          "transition-all duration-300"
        )}
      >
        <DialogHeader className="pb-4">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary animate-pulse" />
            添加新应用
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            添加一个新的应用到您的天文摄影工具列表中
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div {...fadeIn}>
              <FormSkeleton />
            </motion.div>
          ) : (
            <motion.div {...slideUp}>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="space-y-4"
                >
                  {/* 表单进度指示器 */}
                  <div className="space-y-2">
                    <Progress 
                      value={formProgress}
                      className={cn(
                        "h-1 transition-all duration-300",
                        formProgress === 100 ? "bg-green-500" : "bg-blue-500"
                      )}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      完成度: {Math.round(formProgress)}%
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground border-b pb-2">
                      <Settings className="h-4 w-4" />
                      <span>基本信息</span>
                    </div>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex items-center justify-between">
                            <FormLabel className="text-sm font-medium flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              应用名称
                            </FormLabel>
                            <ValidationIndicator
                              isValid={Boolean(dirtyFields.name && !errors.name)}
                              message={errors.name?.message || "名称格式正确"}
                            />
                          </div>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="输入应用名称"
                              disabled={isSubmitting}
                              className={cn(
                                "w-full h-9",
                                "transition-all duration-300",
                                "focus:ring-2 focus:ring-primary/20",
                                "hover:border-primary/50",
                                "disabled:opacity-50",
                                errors.name && "border-red-500 focus:border-red-500"
                              )}
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                          <FormDescription className="text-xs text-muted-foreground">
                            用于识别和显示的应用名称
                          </FormDescription>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">应用类别</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger
                                className={cn(
                                  "w-full transition-all duration-300",
                                  "focus:ring-2 focus:ring-primary/20",
                                  "hover:border-primary/50"
                                )}
                              >
                                <SelectValue placeholder="选择应用类别" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(categoryIcons).map(([key, icon]) => (
                                <SelectItem key={key} value={key}>
                                  <div className="flex items-center gap-2">
                                    <span className="w-4 h-4 flex items-center justify-center rounded bg-primary/10 text-primary text-xs">
                                      {icon}
                                    </span>
                                    <span>{key === "microsoft" ? "微软应用" :
                                           key === "system" ? "系统工具" :
                                           key === "tools" ? "常用工具" :
                                           key === "development" ? "开发工具" :
                                           "媒体工具"}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                    
                    {/* URL 和其他字段... */}

                  </div>

                  <motion.div
                    className="flex justify-end gap-2 pt-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        disabled={isSubmitting}
                        onClick={() => onOpenChange?.(false)}
                        className={cn(
                          "w-24 h-9 text-sm",
                          "transition-all duration-300",
                          "hover:bg-destructive/10",
                          "hover:text-destructive",
                          "hover:border-destructive/50"
                        )}
                      >
                        取消
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        type="submit"
                        disabled={isSubmitting || !isValid}
                        className={cn(
                          "w-24 h-9 text-sm",
                          "transition-all duration-300",
                          "disabled:opacity-50"
                        )}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            添加中
                          </>
                        ) : (
                          "添加"
                        )}
                      </Button>
                    </motion.div>
                  </motion.div>
                </form>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
});

AddAppDialog.displayName = "AddAppDialog";

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};
