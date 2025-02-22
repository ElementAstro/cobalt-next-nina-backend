"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Upload,
  Download,
  Trash2,
  Edit2,
  FolderTree,
  FileWarning,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { App } from "@/types/extra";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export interface BulkAction {
  type: 'import' | 'export' | 'delete' | 'rename' | 'categorize';
  status: 'idle' | 'processing' | 'success' | 'error';
  progress?: number;
  error?: string;
}

interface BulkActionsProps {
  selectedApps: App[];
  categories: string[];
  onImport: (apps: App[]) => Promise<void>;
  onExport: () => Promise<void>;
  onDelete: (appIds: string[]) => Promise<void>;
  onRename: (pattern: string, replacement: string) => Promise<void>;
  onCategorize: (appIds: string[], category: string) => Promise<void>;
  disabled?: boolean;
}

export function BulkActions({
  selectedApps,
  categories,
  onImport,
  onExport,
  onDelete,
  onRename,
  onCategorize,
  disabled = false,
}: BulkActionsProps) {
  const [currentAction, setCurrentAction] = useState<BulkAction>({
    type: 'import',
    status: 'idle'
  });
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [categorizeDialogOpen, setCategorizeDialogOpen] = useState(false);
  const [searchPattern, setSearchPattern] = useState("");
  const [replacement, setReplacement] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCurrentAction({ type: 'import', status: 'processing', progress: 0 });

    try {
      const text = await file.text();
      let apps: App[];

      try {
        apps = JSON.parse(text);
      } catch {
        throw new Error("无效的 JSON 格式");
      }

      if (!Array.isArray(apps)) {
        throw new Error("导入数据必须是数组格式");
      }

      if (!apps.every(app => 
        typeof app.id === 'string' &&
        typeof app.name === 'string' &&
        typeof app.icon === 'string' &&
        typeof app.url === 'string' &&
        typeof app.category === 'string'
      )) {
        throw new Error("部分应用数据格式不正确");
      }

      // 模拟进度
      const updateProgress = (progress: number) => {
        setCurrentAction(prev => ({ ...prev, progress }));
      };

      for (let i = 0; i <= 100; i += 10) {
        updateProgress(i);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      await onImport(apps);
      
      setCurrentAction({ type: 'import', status: 'success' });
      toast({
        title: "导入成功",
        description: `已成功导入 ${apps.length} 个应用`,
        action: <CheckCircle className="h-5 w-5 text-green-500" />,
      });

      setImportDialogOpen(false);
    } catch (error) {
      setCurrentAction({
        type: 'import',
        status: 'error',
        error: error instanceof Error ? error.message : "导入失败"
      });

      toast({
        title: "导入失败",
        description: error instanceof Error ? error.message : "导入过程中发生错误",
        variant: "destructive",
        action: <AlertCircle className="h-5 w-5" />,
      });
    }
  }, [onImport]);

  const handleExport = useCallback(async () => {
    setCurrentAction({ type: 'export', status: 'processing' });

    try {
      await onExport();
      setCurrentAction({ type: 'export', status: 'success' });
      
      toast({
        title: "导出成功",
        description: "应用配置已成功导出",
        action: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
    } catch (error) {
      setCurrentAction({
        type: 'export',
        status: 'error',
        error: error instanceof Error ? error.message : "导出失败"
      });

      toast({
        title: "导出失败",
        description: error instanceof Error ? error.message : "导出过程中发生错误",
        variant: "destructive",
        action: <AlertCircle className="h-5 w-5" />,
      });
    }
  }, [onExport]);

  const handleDelete = useCallback(async () => {
    if (!selectedApps.length) return;

    setCurrentAction({ type: 'delete', status: 'processing' });

    try {
      await onDelete(selectedApps.map(app => app.id));
      setCurrentAction({ type: 'delete', status: 'success' });

      toast({
        title: "删除成功",
        description: `已删除 ${selectedApps.length} 个应用`,
        action: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
    } catch (error) {
      setCurrentAction({
        type: 'delete',
        status: 'error',
        error: error instanceof Error ? error.message : "删除失败"
      });

      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "删除过程中发生错误",
        variant: "destructive",
        action: <AlertCircle className="h-5 w-5" />,
      });
    }
  }, [selectedApps, onDelete]);

  const handleRename = useCallback(async () => {
    if (!searchPattern) return;

    setCurrentAction({ type: 'rename', status: 'processing' });

    try {
      await onRename(searchPattern, replacement);
      setCurrentAction({ type: 'rename', status: 'success' });
      setRenameDialogOpen(false);

      toast({
        title: "重命名成功",
        description: "已完成批量重命名操作",
        action: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
    } catch (error) {
      setCurrentAction({
        type: 'rename',
        status: 'error',
        error: error instanceof Error ? error.message : "重命名失败"
      });

      toast({
        title: "重命名失败",
        description: error instanceof Error ? error.message : "重命名过程中发生错误",
        variant: "destructive",
        action: <AlertCircle className="h-5 w-5" />,
      });
    }
  }, [searchPattern, replacement, onRename]);

  const handleCategorize = useCallback(async () => {
    if (!selectedCategory || !selectedApps.length) return;

    setCurrentAction({ type: 'categorize', status: 'processing' });

    try {
      await onCategorize(selectedApps.map(app => app.id), selectedCategory);
      setCurrentAction({ type: 'categorize', status: 'success' });
      setCategorizeDialogOpen(false);

      toast({
        title: "分类成功",
        description: `已将 ${selectedApps.length} 个应用移至 "${selectedCategory}" 分类`,
        action: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
    } catch (error) {
      setCurrentAction({
        type: 'categorize',
        status: 'error',
        error: error instanceof Error ? error.message : "分类失败"
      });

      toast({
        title: "分类失败",
        description: error instanceof Error ? error.message : "分类过程中发生错误",
        variant: "destructive",
        action: <AlertCircle className="h-5 w-5" />,
      });
    }
  }, [selectedCategory, selectedApps, onCategorize]);

  const renderActionIcon = useCallback((type: BulkAction['type']) => {
    const isCurrentAction = currentAction.type === type;
    const status = isCurrentAction ? currentAction.status : 'idle';

    switch (status) {
      case 'processing':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <RefreshCw className="h-4 w-4" />
          </motion.div>
        );
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        switch (type) {
          case 'import':
            return <Upload className="h-4 w-4" />;
          case 'export':
            return <Download className="h-4 w-4" />;
          case 'delete':
            return <Trash2 className="h-4 w-4" />;
          case 'rename':
            return <Edit2 className="h-4 w-4" />;
          case 'categorize':
            return <FolderTree className="h-4 w-4" />;
        }
    }
  }, [currentAction]);

  return (
    <div className="flex flex-wrap gap-2">
      {/* 导入对话框 */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || currentAction.status === 'processing'}
          >
            {renderActionIcon('import')}
            <span className="ml-2">导入</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入应用</DialogTitle>
            <DialogDescription>选择一个JSON文件导入应用配置</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              disabled={currentAction.status === 'processing'}
            />
            {currentAction.type === 'import' && currentAction.status === 'processing' && (
              <Progress value={currentAction.progress} className="w-full" />
            )}
            {currentAction.type === 'import' && currentAction.status === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <FileWarning className="h-4 w-4" />
                <span>{currentAction.error}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 导出按钮 */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleExport}
        disabled={disabled || currentAction.status === 'processing'}
      >
        {renderActionIcon('export')}
        <span className="ml-2">导出</span>
      </Button>

      {/* 重命名对话框 */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || !selectedApps.length || currentAction.status === 'processing'}
          >
            {renderActionIcon('rename')}
            <span className="ml-2">重命名</span>
            {selectedApps.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedApps.length}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量重命名</DialogTitle>
            <DialogDescription>
              使用查找替换方式重命名选中的应用
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">查找内容</label>
              <Input
                value={searchPattern}
                onChange={(e) => setSearchPattern(e.target.value)}
                placeholder="输入要查找的文本"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">替换为</label>
              <Input
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                placeholder="输入要替换的文本"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
              disabled={currentAction.status === 'processing'}
            >
              取消
            </Button>
            <Button
              onClick={handleRename}
              disabled={!searchPattern || currentAction.status === 'processing'}
            >
              {currentAction.status === 'processing' ? '处理中...' : '确认'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 分类对话框 */}
      <Dialog open={categorizeDialogOpen} onOpenChange={setCategorizeDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || !selectedApps.length || currentAction.status === 'processing'}
          >
            {renderActionIcon('categorize')}
            <span className="ml-2">分类</span>
            {selectedApps.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedApps.length}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量分类</DialogTitle>
            <DialogDescription>
              将选中的应用移动到指定分类
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="选择目标分类" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCategorizeDialogOpen(false)}
              disabled={currentAction.status === 'processing'}
            >
              取消
            </Button>
            <Button
              onClick={handleCategorize}
              disabled={!selectedCategory || currentAction.status === 'processing'}
            >
              {currentAction.status === 'processing' ? '处理中...' : '确认'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={disabled || !selectedApps.length || currentAction.status === 'processing'}
          >
            {renderActionIcon('delete')}
            <span className="ml-2">删除</span>
            {selectedApps.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selectedApps.length}
              </Badge>
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除选中的 {selectedApps.length} 个应用吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {currentAction.status === 'processing' ? '处理中...' : '确认删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 操作状态指示 */}
      <AnimatePresence>
        {currentAction.status === 'processing' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>处理中...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
