"use client";

import React, { useState, useCallback } from "react";
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
import * as z from "zod";

// 验证模式
const noteSchema = z.object({
  content: z.string().max(1000, "备注内容不能超过1000个字符"),
  tag: z.string().max(50, "标签不能超过50个字符").optional(),
});

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

  // 获取唯一标签列表及其使用频率
  const tagSuggestions = React.useMemo(() => {
    const suggestions = new Map<string, { count: number; lastUsed: Date }>();
    
    logs.forEach(log => {
      log.tags?.forEach(tag => {
        const existing = suggestions.get(tag);
        if (existing) {
          existing.count++;
          if (log.timestamp > existing.lastUsed.toISOString()) {
            existing.lastUsed = new Date(log.timestamp);
          }
        } else {
          suggestions.set(tag, {
            count: 1,
            lastUsed: new Date(log.timestamp)
          });
        }
      });
    });

    return Array.from(suggestions.entries())
      .map(([tag, { count, lastUsed }]) => ({
        tag,
        count,
        lastUsed
      }))
      .sort((a, b) => b.count - a.count || b.lastUsed.getTime() - a.lastUsed.getTime());
  }, [logs]);

  const handleSave = useCallback(async () => {
    if (!selectedLogForNote) return;

    try {
      setIsLoading(true);
      setError(null);

      // 验证输入
      const validationResult = noteSchema.safeParse({
        content: newNote,
        tag: customTag || newTag
      });

      if (!validationResult.success) {
        throw new Error(validationResult.error.errors[0].message);
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

      await new Promise(resolve => setTimeout(resolve, 500)); // 模拟保存延迟

      setLogs(updatedLogs);
      setFilteredLogs(updatedLogs);

      // 重置表单
      setNewNote("");
      setNewTag("");
      setCustomTag("");
      setSelectedLogForNote(null);

      toast.success("保存成功", {
        description: "备注和标签已更新",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "保存失败";
      setError({ message });
      toast.error("操作失败", {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedLogForNote, newNote, customTag, newTag, logs, setLogs, setFilteredLogs, setSelectedLogForNote, setNewNote, setNewTag]);

  const handleTagRemove = useCallback((tagToRemove: string) => {
    if (!selectedLogForNote) return;

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
  }, [selectedLogForNote, logs, setLogs, setFilteredLogs]);

  const handleFileSelect = useCallback((file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("文件过大", {
        description: "请选择小于10MB的文件"
      });
      return;
    }

    setSelectedFile(file);
    toast.success("文件已选择", {
      description: `${file.name} (${(file.size / 1024).toFixed(2)}KB)`
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedLogForNote(null);
    setNewNote("");
    setNewTag("");
    setCustomTag("");
    setError(null);
    setSelectedFile(null);
    setUploadProgress(0);
  }, [setSelectedLogForNote, setNewNote, setNewTag]);

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
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm font-medium">{error.message}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">原始日志</CardTitle>
                <CardDescription>
                  {new Date(selectedLogForNote.timestamp).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[100px] w-full rounded-md border p-4">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {selectedLogForNote.message}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {/* 文件上传区域 */}
              <Card
                className={cn(
                  "border-2 border-dashed transition-colors",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <CardContent className="flex flex-col items-center justify-center py-8 space-y-4">
                  <motion.div
                    animate={{
                      scale: isDragging ? 1.1 : 1,
                      opacity: isDragging ? 0.5 : 1,
                    }}
                  >
                    {selectedFile ? (
                      <CheckCircle className="h-8 w-8 text-primary" />
                    ) : (
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    )}
                  </motion.div>
                  
                  <div className="space-y-1 text-center">
                    <p className="text-sm text-muted-foreground">
                      {selectedFile ? (
                        <>
                          已选择：{selectedFile.name}
                          <br />
                          <span className="text-xs">
                            ({(selectedFile.size / 1024).toFixed(2)}KB)
                          </span>
                        </>
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
                            />
                          </label>
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
                        <Progress value={uploadProgress} className="h-2" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>

              {/* 标签管理 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">已有标签</Label>
                <div className="flex flex-wrap gap-2 min-h-[32px] p-2 rounded-md border bg-muted/50">
                  <AnimatePresence>
                    {selectedLogForNote.tags?.map((tag) => (
                      <motion.div
                        key={tag}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
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
                    ))}
                  </AnimatePresence>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">添加新标签</Label>
                <div className="flex gap-2">
                  <Popover 
                    open={openTagSuggestions} 
                    onOpenChange={setOpenTagSuggestions}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-[200px] justify-between"
                      >
                        {newTag || "选择已有标签..."}
                        <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandGroup>
                          {tagSuggestions.map(({ tag, count }) => (
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
                              <Badge 
                                variant="secondary" 
                                className="ml-auto"
                              >
                                {count}
                              </Badge>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="或输入新标签..."
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      className="pl-9"
                      maxLength={50}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">备注内容</Label>
                <Textarea
                  placeholder="添加备注..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[100px] resize-y"
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {newNote.length}/1000
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" disabled={isLoading}>
                取消
              </Button>
            </DialogClose>
            <Button 
              onClick={handleSave} 
              disabled={isLoading}
              className={cn(
                "min-w-[80px]",
                isLoading && "cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  保存
                </>
              )}
            </Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default LogUploadDialog;
