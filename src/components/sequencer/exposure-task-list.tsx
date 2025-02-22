"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSequencerStore } from "@/stores/sequencer";
import {
  Play,
  Pause,
  Trash2,
  MoreVertical,
  Plus,
  Settings,
  AlertCircle,
  Copy,
  Edit,
  Clock,
  Camera,
  Filter,
  Loader2,
  ArrowUpDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SortableItem } from "./sortable-item";

interface ExposureTask {
  id: string;
  name: string;
  type: "light" | "dark" | "flat" | "bias";
  exposure: number;
  binning: number;
  filter: string;
  count: number;
  progress: [number, number];
  status: "pending" | "running" | "completed" | "failed";
  temperature: number;
  gain: number;
  offset: number;
}

export function ExposureTaskList() {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const {
    exposureTasks: tasks,
    updateExposureTaskOrder: updateTaskOrder,
    startExposureTask: startTask,
    pauseExposureTask: pauseTask,
    deleteExposureTask: deleteTask,
  } = useSequencerStore();

  // 初始加载
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      try {
        // 这里可以添加实际的任务加载逻辑
        await new Promise(resolve => setTimeout(resolve, 1000));
      } finally {
        setIsLoading(false);
      }
    };
    loadTasks();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((t: ExposureTask) => t.id === active.id);
      const newIndex = tasks.findIndex((t: ExposureTask) => t.id === over.id);
      updateTaskOrder(arrayMove(tasks, oldIndex, newIndex));
    }
  }, [tasks, updateTaskOrder]);

  const toggleTaskSelection = useCallback((taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  }, []);

  const handleBulkDelete = useCallback(() => {
    selectedTasks.forEach(deleteTask);
    setSelectedTasks([]);
  }, [selectedTasks, deleteTask]);

  const getStatusColor = (status: ExposureTask["status"]) => {
    switch (status) {
      case "running":
        return "bg-blue-500/10 text-blue-400 border-blue-500/50";
      case "completed":
        return "bg-green-500/10 text-green-400 border-green-500/50";
      case "failed":
        return "bg-red-500/10 text-red-400 border-red-500/50";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/50";
    }
  };

  const getStatusIcon = (status: ExposureTask["status"]) => {
    switch (status) {
      case "running":
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case "completed":
        return <Camera className="w-4 h-4" />;
      case "failed":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800">
      <CardHeader className="space-y-1 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xl">曝光任务</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {tasks.length} 个任务
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {selectedTasks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                <Badge variant="secondary" className="text-xs">
                  已选择 {selectedTasks.length} 项
                </Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBulkDelete}
                        className="h-8 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>删除选中任务</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </motion.div>
            )}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Plus className="w-4 h-4 mr-1" />
                  添加任务
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>添加曝光任务</DialogTitle>
                  <DialogDescription>
                    创建新的曝光任务并添加到列表中。
                  </DialogDescription>
                </DialogHeader>
                {/* 添加任务表单 */}
              </DialogContent>
            </Dialog>
            <Button variant="ghost" size="sm" className="h-8">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="border-t border-gray-800">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <Camera className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">暂无曝光任务</p>
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-800/50">
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedTasks.length === tasks.length &&
                          tasks.length > 0
                        }
                        onCheckedChange={(checked) => {
                          setSelectedTasks(
                            checked ? tasks.map((t: ExposureTask) => t.id) : []
                          );
                        }}
                      />
                    </TableHead>
                    <TableHead className="font-medium">
                      <div className="flex items-center gap-2">
                        <span>任务名称</span>
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>滤镜</TableHead>
                    <TableHead className="text-right">曝光</TableHead>
                    <TableHead className="text-right">进度</TableHead>
                    <TableHead className="text-right">状态</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={tasks.map((t: ExposureTask) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <AnimatePresence mode="popLayout">
                        {tasks.map((task: ExposureTask) => (
                          <SortableItem key={task.id} value={task.id}>
                            <motion.tr
                              layout
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className={`
                                group hover:bg-gray-800/30
                                ${selectedTasks.includes(task.id) ? "bg-gray-800/50" : ""}
                              `}
                            >
                              <TableCell>
                                <Checkbox
                                  checked={selectedTasks.includes(task.id)}
                                  onCheckedChange={() => toggleTaskSelection(task.id)}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(task.status)}
                                  <span className="font-medium">{task.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{task.type}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Filter className="w-4 h-4 text-gray-400" />
                                  <span>{task.filter}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {task.exposure}s × {task.count}
                              </TableCell>
                              <TableCell className="w-32">
                                <div className="flex items-center justify-end gap-2">
                                  <Progress
                                    value={(task.progress[0] / task.progress[1]) * 100}
                                    className="w-20 h-2"
                                  />
                                  <span className="text-xs text-gray-400 tabular-nums">
                                    {task.progress[0]}/{task.progress[1]}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={getStatusColor(task.status)}
                                >
                                  {task.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            task.status === "running"
                                              ? pauseTask(task.id)
                                              : startTask(task.id)
                                          }
                                          className="h-8 w-8 p-0"
                                        >
                                          {task.status === "running" ? (
                                            <Pause className="w-4 h-4" />
                                          ) : (
                                            <Play className="w-4 h-4" />
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>
                                          {task.status === "running"
                                            ? "暂停任务"
                                            : "开始任务"}
                                        </p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                      >
                                        <MoreVertical className="w-4 h-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>任务操作</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem>
                                        <Edit className="w-4 h-4 mr-2" />
                                        编辑任务
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <Copy className="w-4 h-4 mr-2" />
                                        复制任务
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-red-500"
                                        onClick={() => deleteTask(task.id)}
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        删除任务
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </motion.tr>
                          </SortableItem>
                        ))}
                      </AnimatePresence>
                    </SortableContext>
                  </DndContext>
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </CardContent>

      {tasks.length > 0 && (
        <CardFooter className="flex items-center justify-between p-4 border-t border-gray-800">
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div>总任务: {tasks.length}</div>
            <div>
              已完成:{" "}
              {tasks.filter((t: ExposureTask) => t.status === "completed").length}
            </div>
            <div>
              运行中:{" "}
              {tasks.filter((t: ExposureTask) => t.status === "running").length}
            </div>
          </div>
          <Button variant="outline" size="sm" className="h-8">
            导出任务列表
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
