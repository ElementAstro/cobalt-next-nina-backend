"use client";

import React, { useState } from "react";
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

interface TagSuggestion {
  value: string;
  count: number;
  lastUsed: Date;
}

const LogUploadDialog: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openTagSuggestions, setOpenTagSuggestions] = useState(false);
  const [customTag, setCustomTag] = useState("");

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

  // Get unique tags and their usage count
  const tagSuggestions = React.useMemo(() => {
    const suggestions = new Map<string, TagSuggestion>();
    
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
            value: tag,
            count: 1,
            lastUsed: new Date(log.timestamp)
          });
        }
      });
    });

    return Array.from(suggestions.values())
      .sort((a, b) => b.count - a.count || b.lastUsed.getTime() - a.lastUsed.getTime());
  }, [logs]);

  const handleSave = async () => {
    if (!selectedLogForNote) return;

    try {
      setIsLoading(true);
      setError(null);

      // Validate inputs
      if (customTag && customTag.length > 50) {
        throw new Error("标签长度不能超过50个字符");
      }

      // Prepare tags
      const finalTag = customTag || newTag;
      const updatedTags = finalTag
        ? [...new Set([...(selectedLogForNote.tags || []), finalTag])]
        : selectedLogForNote.tags;

      // Update logs
      const updatedLogs = logs.map((log) =>
        log.id === selectedLogForNote.id
          ? {
              ...log,
              note: newNote || log.note,
              tags: updatedTags,
            }
          : log
      );

      setLogs(updatedLogs);
      setFilteredLogs(updatedLogs);

      // Reset form
      setNewNote("");
      setNewTag("");
      setCustomTag("");
      setSelectedLogForNote(null);

      toast.success("保存成功", {
        description: "备注和标签已更新",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "保存失败";
      setError(message);
      toast.error("操作失败", {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
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
  };

  const handleClose = () => {
    setSelectedLogForNote(null);
    setNewNote("");
    setNewTag("");
    setCustomTag("");
    setError(null);
  };

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
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md"
              >
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">原始日志</CardTitle>
                <CardDescription>
                  {new Date(selectedLogForNote.timestamp).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[100px] w-full rounded-md border p-4">
                  <pre className="text-sm font-mono">
                    {selectedLogForNote.message}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="space-y-4">
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
                          className="pl-2 h-6 gap-1 hover:bg-muted"
                        >
                          <span>{tag}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 p-0 hover:bg-transparent"
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
                          {tagSuggestions.map((tag) => (
                            <CommandItem
                              key={tag.value}
                              value={tag.value}
                              onSelect={(value) => {
                                setNewTag(value);
                                setOpenTagSuggestions(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  newTag === tag.value ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <span>{tag.value}</span>
                              <Badge 
                                variant="secondary" 
                                className="ml-auto"
                              >
                                {tag.count}
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
                />
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
