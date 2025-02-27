"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tag,
  X,
  Save,
  AlertCircle,
  Loader2,
  MessageSquare,
  Plus,
  Upload,
  File,
  CheckCircle,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useLogStore } from "@/stores/logStore";
import { cn } from "@/lib/utils";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

interface ErrorState {
  message: string;
  field?: string;
}

const LogUploadDialog: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [openTagSuggestions, setOpenTagSuggestions] = useState(false);
  const [customTag, setCustomTag] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDraggedOutside, setIsDraggedOutside] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  }>({});
  const [hasChanges, setHasChanges] = useState(false);

  const fileUploadRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const uploadSimulationTimeout = useRef<NodeJS.Timeout | null>(null);
  const initialFormState = useRef({
    note: "",
    tag: "",
    file: null as File | null,
  });

  const {
    selectedLogForNote,
    setSelectedLogForNote,
    logs,
    setLogs,
    setFilteredLogs,
    newNote,
    setNewNote,
    newTag,
    setNewTag,
  } = useLogStore();

  // 初始化表单状态，用于检测变更
  useEffect(() => {
    if (selectedLogForNote) {
      initialFormState.current = {
        note: selectedLogForNote.note || "",
        tag: "",
        file: null,
      };

      // 自动聚焦备注文本区域
      setTimeout(() => {
        noteTextareaRef.current?.focus();
      }, 100);
    }
  }, [selectedLogForNote]);

  // 检测表单变更
  useEffect(() => {
    const hasNoteChanges = newNote !== initialFormState.current.note;
    const hasTagChanges = customTag !== "" || newTag !== "";
    const hasFileChanges = selectedFile !== null;

    setHasChanges(hasNoteChanges || hasTagChanges || hasFileChanges);
  }, [newNote, customTag, newTag, selectedFile]);

  // 获取唯一标签列表及其使用频率
  const tagSuggestions = React.useMemo(() => {
    const suggestions = new Map<string, { count: number; lastUsed: Date }>();

    logs.forEach((log) => {
      log.tags?.forEach((tag) => {
        const existing = suggestions.get(tag);
        if (existing) {
          existing.count++;
          if (log.timestamp > existing.lastUsed.toISOString()) {
            existing.lastUsed = new Date(log.timestamp);
          }
        } else {
          suggestions.set(tag, {
            count: 1,
            lastUsed: new Date(log.timestamp),
          });
        }
      });
    });

    return Array.from(suggestions.entries())
      .map(([tag, { count, lastUsed }]) => ({
        tag,
        count,
        lastUsed,
      }))
      .sort(
        (a, b) =>
          b.count - a.count || b.lastUsed.getTime() - a.lastUsed.getTime()
      );
  }, [logs]);

  // 清理上传模拟计时器
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (uploadSimulationTimeout.current) {
        clearTimeout(uploadSimulationTimeout.current);
      }
    };
  }, []);

  // 模拟文件上传进度
  const simulateUploadProgress = useCallback(() => {
    setUploadProgress(0);

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    // 模拟进度条增加的效果
    progressIntervalRef.current = setInterval(() => {
      setUploadProgress((prev) => {
        const increment = Math.random() * 15;
        const nextProgress = prev + increment;

        if (nextProgress >= 95) {
          clearInterval(progressIntervalRef.current!);
          return 95;
        }

        return nextProgress;
      });
    }, 300);

    // 模拟上传完成
    uploadSimulationTimeout.current = setTimeout(() => {
      clearInterval(progressIntervalRef.current!);
      setUploadProgress(100);

      // 完成后重置
      setTimeout(() => {
        setUploadProgress(0);
      }, 1500);
    }, 2500);
  }, []);

  // 点击上传区域触发文件选择
  const handleUploadAreaClick = useCallback(() => {
    if (!selectedFile && fileUploadRef.current) {
      fileUploadRef.current.click();
    }
  }, [selectedFile]);

  // 验证表单
  const validateForm = useCallback(() => {
    const errors: { [key: string]: string } = {};

    if (newNote && newNote.length > 1000) {
      errors.note = "备注内容不能超过1000个字符";
    }

    if ((customTag || newTag) && (customTag || newTag).length > 50) {
      errors.tag = "标签不能超过50个字符";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newNote, customTag, newTag]);

  const handleSave = useCallback(async () => {
    if (!selectedLogForNote) return;

    try {
      // 验证表单
      if (!validateForm()) {
        throw new Error("请修复表单中的错误");
      }

      setIsLoading(true);
      setError(null);
      setSaveSuccess(false);

      // 如果有文件，模拟上传进度
      if (selectedFile) {
        simulateUploadProgress();
      }

      // 准备标签
      const finalTag = customTag || newTag;
      const updatedTags = finalTag
        ? [...new Set([...(selectedLogForNote.tags || []), finalTag])]
        : selectedLogForNote.tags;

      // 更新日志
      const updatedLogs = logs.map((log) =>
        log.id === selectedLogForNote.id
          ? {
              ...log,
              note: newNote || log.note,
              tags: updatedTags,
            }
          : log
      );

      // 模拟网络延迟
      await new Promise((resolve) => setTimeout(resolve, 800));

      setLogs(updatedLogs);
      setFilteredLogs(updatedLogs);

      setSaveSuccess(true);
      toast.success("保存成功", {
        description: "备注和标签已更新",
        icon: <CheckCircle className="h-4 w-4" />,
      });

      // 延迟关闭对话框
      setTimeout(() => {
        // 重置表单
        setNewNote("");
        setNewTag("");
        setCustomTag("");
        setSelectedFile(null);
        setSelectedLogForNote(null);
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "保存失败";
      setError({ message });
      toast.error("操作失败", {
        description: message,
        icon: <AlertCircle className="h-4 w-4" />,
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    selectedLogForNote,
    validateForm,
    selectedFile,
    customTag,
    newTag,
    logs,
    setLogs,
    setFilteredLogs,
    simulateUploadProgress,
    newNote,
    setNewNote,
    setNewTag,
    setSelectedLogForNote,
  ]);

  const handleTagRemove = useCallback(
    (tagToRemove: string) => {
      if (!selectedLogForNote) return;

      toast.promise(
        // 模拟异步操作
        new Promise((resolve) => {
          setTimeout(() => {
            const updatedLogs = logs.map((log) =>
              log.id === selectedLogForNote.id
                ? {
                    ...log,
                    tags: (log.tags || []).filter((tag) => tag !== tagToRemove),
                  }
                : log
            );

            setLogs(updatedLogs);
            setFilteredLogs(updatedLogs);
            resolve(true);
          }, 300);
        }),
        {
          loading: "正在移除标签...",
          success: `标签 "${tagToRemove}" 已移除`,
          error: "移除标签失败",
        }
      );
    },
    [selectedLogForNote, logs, setLogs, setFilteredLogs]
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      // 文件类型验证
      const validTypes = [".json", ".csv", "application/json", "text/csv"];
      const isValidType = validTypes.some(
        (type) => file.name.endsWith(type) || file.type === type
      );

      if (!isValidType) {
        toast.error("文件类型不支持", {
          description: "请上传 JSON 或 CSV 格式的文件",
          icon: <File className="h-4 w-4" />,
        });
        return;
      }

      // 文件大小验证
      if (file.size > 10 * 1024 * 1024) {
        toast.error("文件过大", {
          description: "请选择小于10MB的文件",
          icon: <AlertCircle className="h-4 w-4" />,
        });
        return;
      }

      setSelectedFile(file);

      // 文件上传成功反馈
      toast.success("文件已选择", {
        description: `${file.name} (${(file.size / 1024).toFixed(2)}KB)`,
        icon: <File className="h-4 w-4" />,
      });

      // 模拟文件验证进度
      simulateUploadProgress();
    },
    [simulateUploadProgress]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setIsDraggedOutside(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setIsDraggedOutside(false);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // 如果拖拽离开的是dropzone本身，而不是其子元素
    if (
      dropzoneRef.current &&
      !dropzoneRef.current.contains(e.relatedTarget as Node)
    ) {
      setIsDragging(false);
      setIsDraggedOutside(true);
    }
  }, []);

  const closeDialog = useCallback(() => {
    setSelectedLogForNote(null);
    setNewNote("");
    setNewTag("");
    setCustomTag("");
    setError(null);
    setSelectedFile(null);
    setUploadProgress(0);
    setValidationErrors({});
  }, [setNewNote, setNewTag, setSelectedLogForNote]);

  // 未保存更改提示
  const handleClose = useCallback(() => {
    if (hasChanges) {
      if (confirm("您有未保存的更改，确定要关闭吗？")) {
        closeDialog();
      }
    } else {
      closeDialog();
    }
  }, [closeDialog, hasChanges]);

  if (!selectedLogForNote) return null;

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5 text-primary" />
              添加备注和标签
              {hasChanges && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-2"
                >
                  <Badge variant="outline" className="text-xs">
                    已修改
                  </Badge>
                </motion.div>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <p className="text-sm font-medium">{error.message}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <File className="h-4 w-4" />
                  原始日志
                </CardTitle>
                <CardDescription>
                  {new Date(selectedLogForNote.timestamp).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <ScrollArea className="h-[100px] w-full rounded-md border p-4">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
                      {selectedLogForNote.message}
                    </pre>
                  </ScrollArea>
                </motion.div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {/* 文件上传区域 */}
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card
                  className={cn(
                    "border-2 border-dashed transition-all",
                    isDragging
                      ? "border-primary bg-primary/5 scale-[1.01] shadow-lg"
                      : isDraggedOutside
                      ? "border-destructive/50 bg-destructive/5"
                      : "border-muted-foreground/25",
                    selectedFile && "border-primary/50 bg-primary/5"
                  )}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleUploadAreaClick}
                  ref={dropzoneRef}
                >
                  <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
                    <motion.div
                      animate={{
                        scale: isDragging ? 1.1 : selectedFile ? 1.05 : 1,
                        opacity: isDragging ? 0.5 : 1,
                        rotate: isDragging ? [0, -5, 5, 0] : 0,
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      {selectedFile ? (
                        <CheckCircle className="h-8 w-8 text-primary" />
                      ) : (
                        <Upload
                          className={cn(
                            "h-8 w-8",
                            isDraggedOutside
                              ? "text-destructive/50"
                              : "text-muted-foreground"
                          )}
                        />
                      )}
                    </motion.div>

                    <div className="space-y-1 text-center">
                      <p className="text-sm text-muted-foreground">
                        {selectedFile ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center"
                          >
                            <span>已选择：{selectedFile.name}</span>
                            <span className="text-xs">
                              ({(selectedFile.size / 1024).toFixed(2)}KB)
                            </span>
                            <Button
                              variant="ghost"
                              className="text-xs h-6 mt-1"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFile(null);
                              }}
                            >
                              <X className="h-3 w-3 mr-1" />
                              移除
                            </Button>
                          </motion.div>
                        ) : (
                          <>
                            {isDraggedOutside ? (
                              <span className="text-destructive/70">
                                放开文件以取消
                              </span>
                            ) : isDragging ? (
                              <span className="text-primary font-medium">
                                松开以上传文件
                              </span>
                            ) : (
                              <>
                                拖放文件到此处，或者
                                <label
                                  htmlFor="file-upload"
                                  className="relative cursor-pointer text-primary hover:text-primary/90 mx-1"
                                >
                                  点击上传
                                  <input
                                    id="file-upload"
                                    type="file"
                                    className="sr-only"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleFileSelect(file);
                                    }}
                                    accept=".json,.csv"
                                    ref={fileUploadRef}
                                  />
                                </label>
                              </>
                            )}
                          </>
                        )}
                      </p>
                    </div>

                    <AnimatePresence>
                      {uploadProgress > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="w-full max-w-xs"
                        >
                          <div className="relative">
                            <Progress value={uploadProgress} className="h-2" />
                            {uploadProgress >= 100 && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute -right-1 -top-1"
                              >
                                <CheckCircle className="h-4 w-4 text-primary" />
                              </motion.div>
                            )}
                          </div>
                          <p className="text-xs text-center text-muted-foreground mt-1">
                            {uploadProgress < 100 ? "验证中..." : "验证完成"}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>

              {/* 标签管理 */}
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="space-y-2"
              >
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  已有标签
                </Label>
                <div className="flex flex-wrap gap-2 min-h-[32px] p-2 rounded-md border bg-muted/50">
                  <AnimatePresence>
                    {selectedLogForNote.tags?.length ? (
                      selectedLogForNote.tags.map((tag) => (
                        <motion.div
                          key={tag}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
                          whileHover={{ scale: 1.05 }}
                        >
                          <Badge
                            variant="secondary"
                            className="pl-2 h-6 gap-1 hover:bg-muted group"
                          >
                            <span>{tag}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleTagRemove(tag)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        </motion.div>
                      ))
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.7 }}
                        className="text-xs text-muted-foreground p-1"
                      >
                        暂无标签
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-2"
              >
                <Label className="text-sm font-medium flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  添加新标签
                </Label>
                <div className="flex gap-2">
                  <Popover
                    open={openTagSuggestions}
                    onOpenChange={setOpenTagSuggestions}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-[200px] justify-between",
                          newTag && "border-primary/50 bg-primary/5"
                        )}
                      >
                        {newTag || "选择已有标签..."}
                        <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandGroup>
                          {tagSuggestions.length > 0 ? (
                            tagSuggestions.map(({ tag, count }) => (
                              <CommandItem
                                key={tag}
                                value={tag}
                                onSelect={(value) => {
                                  setNewTag(value);
                                  setOpenTagSuggestions(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    newTag === tag ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span>{tag}</span>
                                <Badge variant="secondary" className="ml-auto">
                                  {count}
                                </Badge>
                              </CommandItem>
                            ))
                          ) : (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              没有可用标签
                            </div>
                          )}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="或输入新标签..."
                      value={customTag}
                      onChange={(e) => {
                        setCustomTag(e.target.value);
                        setValidationErrors({ ...validationErrors, tag: "" });
                      }}
                      className={cn(
                        "pl-9",
                        customTag && "border-primary/50 bg-primary/5",
                        validationErrors.tag && "border-destructive"
                      )}
                      maxLength={50}
                    />
                    {validationErrors.tag && (
                      <p className="text-destructive text-xs mt-1">
                        {validationErrors.tag}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <Label className="text-sm font-medium flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  备注内容
                </Label>
                <Textarea
                  ref={noteTextareaRef}
                  placeholder="添加备注..."
                  value={newNote}
                  onChange={(e) => {
                    setNewNote(e.target.value);
                    setValidationErrors({ ...validationErrors, note: "" });
                  }}
                  className={cn(
                    "min-h-[100px] resize-y transition-colors",
                    newNote && "border-primary/50 bg-primary/5",
                    validationErrors.note && "border-destructive"
                  )}
                  maxLength={1000}
                />
                <div className="flex justify-between items-center">
                  {validationErrors.note && (
                    <p className="text-destructive text-xs">
                      {validationErrors.note}
                    </p>
                  )}
                  <div
                    className={cn(
                      "text-xs text-muted-foreground ml-auto",
                      newNote.length > 900 && "text-amber-500",
                      newNote.length > 990 && "text-destructive"
                    )}
                  >
                    {newNote.length}/1000
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          <DialogFooter>
            <AnimatePresence mode="wait">
              {saveSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-2 text-primary"
                >
                  <CheckCircle className="h-5 w-5" />
                  <span>保存成功</span>
                </motion.div>
              ) : null}
            </AnimatePresence>
            <DialogClose asChild>
              <Button variant="ghost" disabled={isLoading}>
                取消
              </Button>
            </DialogClose>
            <Button
              onClick={handleSave}
              disabled={isLoading || !hasChanges}
              className={cn(
                "min-w-[80px] relative overflow-hidden",
                isLoading && "cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                </motion.div>
              ) : (
                <motion.div
                  className="flex items-center"
                  animate={{ opacity: hasChanges ? 1 : 0.5 }}
                >
                  <Save className="h-4 w-4 mr-1" />
                  保存
                </motion.div>
              )}

              {/* 保存按钮的粒子动画效果 */}
              {hasChanges && !isLoading && (
                <motion.div className="absolute inset-0 pointer-events-none">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-1 h-1 bg-primary/20 rounded-full"
                      initial={{
                        x: "50%",
                        y: "50%",
                        opacity: 0,
                      }}
                      animate={{
                        x: ["50%", `${30 + Math.random() * 40}%`],
                        y: ["50%", `${30 + Math.random() * 40}%`],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 1 + Math.random(),
                        repeat: Infinity,
                        repeatType: "loop",
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default LogUploadDialog;
