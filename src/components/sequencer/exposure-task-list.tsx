"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion"; // Remove AnimatePresence
import { Progress } from "@/components/ui/progress";
import { Check, AlertCircle, Clock, Play } from "lucide-react"; // Remove Pause
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent, // Add DragEndEvent type
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { SortableItem } from "./sortable-item";
import { useSequencerStore } from "@/stores/sequencer";
import { ExposureTask, TaskGroup } from "@/types/sequencer";
import { debounce } from "lodash";

interface TaskStatus {
  status: "pending" | "running" | "completed" | "failed";
  startTime?: Date;
  endTime?: Date;
  error?: string;
  notified?: boolean;
  progress: number;
}

interface TaskCardProps {
  task: ExposureTask; // 改为ExposureTask
  onEdit: (task: ExposureTask) => void;
  onDelete: (taskId: string) => void;
  updateTask?: (task: ExposureTask) => void;
  taskStatus?: Record<string, TaskStatus>;
}

interface TaskEditFormProps {
  task: ExposureTask;
  onSave: (task: ExposureTask) => void;
  onCancel: () => void;
}

interface ExposureTaskListProps {
  groups?: TaskGroup[];
  onGroupsChange?: (groups: TaskGroup[]) => void;
}

function TaskGroupingDialog({
  selectedTasks,
  onCreateGroup,
  onClose,
}: {
  selectedTasks: string[];
  onCreateGroup: (name: string, taskIds: string[]) => void;
  onClose: () => void;
}) {
  const [groupName, setGroupName] = useState("");

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>创建任务组</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="group-name">组名称</Label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button onClick={() => onCreateGroup(groupName, selectedTasks)}>
              创建
            </Button>
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const updateTaskMock = async (task: ExposureTask) => {
  // 模拟异步操作
  await new Promise((resolve) => setTimeout(resolve, 500));
  return task;
};

// 1. 使用 debounce 优化搜索
const debouncedSearch = debounce(
  (value: string, callback: (value: string) => void) => {
    callback(value);
  },
  300
);

export function ExposureTaskList({
  groups = [],
  onGroupsChange,
}: ExposureTaskListProps) {
  const { targets, activeTargetId, updateTarget, updateTaskStatus } =
    useSequencerStore();

  // Retrieve the active target and its tasks
  const target = targets.find((t) => t.id === activeTargetId);
  const [tasks, setTasks] = useState<ExposureTask[]>(
    target ? target.tasks : []
  );

  // Helper to update tasks of the active target
  const updateTasks = useCallback(
    (newTasks: ExposureTask[]) => {
      if (activeTargetId && target) {
        updateTarget(activeTargetId, { ...target, tasks: newTasks });
      }
    },
    [activeTargetId, target, updateTarget]
  );

  const handleAddTask = () => {
    if (activeTargetId) {
      const newTask: ExposureTask = {
        id: Date.now().toString(),
        name: `任务 ${tasks.length + 1}`,
        enabled: true,
        progress: [0, 1],
        total: 1,
        time: "1s",
        type: "LIGHT",
        filter: "",
        binning: "1x1",
        duration: 0,
        count: 1,
        category: "",
        metadata: {
          camera: {
            gain: 0,
            offset: 0,
            binning: "1x1",
            temperature: -10,
            readoutMode: "normal",
            usbLimit: 40,
            isColorCamera: false,
          },
          filter: {
            name: "",
            offset: 0,
            exposure: 0,
          },
        },
        status: {
          state: "pending",
          progress: 0,
          attempts: 0,
          logs: [],
        },
        settings: {
          dither: false,
          ditherScale: 1,
          focusCheck: false,
          meridianFlip: false,
          autoGuide: false,
          delay: 0,
          repeat: 1,
        },
      };
      updateTasks([...tasks, newTask]);
    }
  };

  const [editingTask, setEditingTask] = useState<ExposureTask | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType] = useState<string>("ALL");

  // 2. 添加搜索防抖
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value, setSearchTerm);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(
      (task) =>
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedType !== "ALL" ? task.type === selectedType : true)
    );
  }, [tasks, searchTerm, selectedType]);

  const updateTask = async (updatedTask: ExposureTask) => {
    const isCompleted = updatedTask.progress[0] === updatedTask.progress[1];
    const prevTask = tasks.find((t) => t.id === updatedTask.id);
    const wasCompleted = prevTask
      ? prevTask.progress[0] === prevTask.progress[1]
      : false;

    updateTasks(
      tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );

    if (isCompleted && !wasCompleted) {
      setTaskStatus((prev) => ({
        ...prev,
        [updatedTask.id]: {
          ...prev[updatedTask.id],
          status: "completed",
          endTime: new Date(),
          notified: false,
          progress: 100,
        },
      }));
    }

    setEditingTask(null);
    setIsDialogOpen(false);
    // 调用 mock 接口，模拟服务器数据更新
    await updateTaskMock(updatedTask);
  };

  const removeTask = (taskId: string) => {
    updateTasks(tasks.filter((task) => task.id !== taskId));
  };

  const editTask = (task: ExposureTask) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  };

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

  const handleBatchDelete = () => {
    updateTasks(tasks.filter((task) => !task.enabled));
  };

  // 添加新的状态和功能
  const [taskStatus, setTaskStatus] = useState<
    Record<
      string,
      {
        status: "pending" | "running" | "completed" | "failed";
        startTime?: Date;
        endTime?: Date;
        error?: string;
        notified?: boolean;
        progress: number;
      }
    >
  >({});

  useEffect(() => {
    const completedTasks = Object.entries(taskStatus).filter(
      ([, status]) => status.status === "completed" && !status.notified
    );

    if (completedTasks.length > 0) {
      completedTasks.forEach(([taskId]) => {
        // 更新通知状态
        setTaskStatus((prev) => ({
          ...prev,
          [taskId]: {
            ...prev[taskId],
            notified: true,
          },
        }));

        // 播放提示音
        new Audio("/sounds/task-completed.mp3").play().catch(() => {});
      });
    }
  }, [taskStatus]);

  const [bulkActions, setBulkActions] = useState({
    selectedTasks: new Set<string>(),
    isSelectAll: false,
  });

  const handleBulkAction = (action: "enable" | "disable" | "delete") => {
    const selectedIds = Array.from(bulkActions.selectedTasks);
    let updatedTasks = [...tasks];

    switch (action) {
      case "enable":
      case "disable":
        updatedTasks = tasks.map((task) =>
          selectedIds.includes(task.id)
            ? { ...task, enabled: action === "enable" }
            : task
        );
        break;
      case "delete":
        updatedTasks = tasks.filter((task) => !selectedIds.includes(task.id));
        break;
    }

    updateTasks(updatedTasks);
    setBulkActions({ selectedTasks: new Set(), isSelectAll: false });
  };

  // 添加批量操作和分组功能
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [groupingMode, setGroupingMode] = useState<
    "none" | "type" | "filter" | "custom"
  >("none");

  // 3. 完善分组模式UI
  const groupingOptions = [
    { value: "none", label: "不分组" },
    { value: "type", label: "按类型分组" },
    { value: "filter", label: "按滤镜分组" },
    { value: "custom", label: "自定义分组" },
  ];

  const handleTaskSelection = (taskId: string, selected: boolean) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(taskId);
      } else {
        next.delete(taskId);
      }
      return next;
    });
  };

  const createTaskGroup = (name: string, taskIds: string[]) => {
    const newGroup: TaskGroup = {
      id: crypto.randomUUID(),
      name,
      tasks: tasks.filter((t) => taskIds.includes(t.id)) as ExposureTask[],
      status: "pending",
      progress: 0,
      settings: {
        concurrent: false,
        maxRetries: 3,
        timeout: 300,
      },
    };
    onGroupsChange?.([...groups, newGroup]);
  };

  // 添加键盘快捷键
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedTasks.size > 0) {
        updateTasks(tasks.filter((task) => !selectedTasks.has(task.id)));
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [selectedTasks, tasks, updateTasks]);

  // 添加拖拽排序的优化
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);
      setTasks((tasks) => arrayMove(tasks, oldIndex, newIndex));
    }
  };

  // 添加任务状态监控
  useEffect(() => {
    const interval = setInterval(() => {
      const runningTasks = tasks.filter(
        (task) => taskStatus[task.id]?.status === "running"
      );

      runningTasks.forEach((task) => {
        // 更新进度
        updateTaskStatus(task.id, {
          ...taskStatus[task.id],
          progress: Math.min(
            taskStatus[task.id].progress + Math.random() * 5,
            100
          ),
        });
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tasks, taskStatus, updateTaskStatus]);

  // 4. 使用 TaskCard 渲染表格行
  const renderTaskRow = (task: ExposureTask) => (
    <SortableItem key={task.id} value={task.id}>
      <TableRow
        className={`group cursor-pointer ${
          selectedTasks.has(task.id) ? "bg-teal-900/20" : ""
        }`}
        onClick={() =>
          handleTaskSelection(task.id, !selectedTasks.has(task.id))
        }
      >
        <TableCell className="w-10">
          <TaskCard
            task={task}
            onEdit={editTask}
            onDelete={removeTask}
            updateTask={updateTask}
            taskStatus={taskStatus}
          />
        </TableCell>
        {/* ...其他单元格保持不变... */}
      </TableRow>
    </SortableItem>
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <div className="p-1">
        {/* 1. 搜索栏更新 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
          <div className="flex items-center space-x-1">
            <Input
              placeholder="搜索任务..."
              onChange={handleSearch}
              className="w-full bg-gray-800/50"
            />
            {/* 2. 添加分组模式选择器 */}
            <Select
              value={groupingMode}
              onValueChange={(value: "none" | "type" | "filter" | "custom") =>
                setGroupingMode(value)
              }
            >
              <SelectTrigger className="w-32 bg-gray-800/50">
                <SelectValue placeholder="分组方式" />
              </SelectTrigger>
              <SelectContent>
                {groupingOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-1 md:col-span-2">
            <Button
              variant="outline"
              onClick={handleBatchDelete}
              className="bg-gray-800/50 border-gray-700 hover:bg-gray-700"
            >
              批量删除
            </Button>
            <Button
              onClick={handleAddTask}
              className="bg-teal-500 hover:bg-teal-600"
            >
              添加任务
            </Button>
          </div>
        </div>

        {/* 3. 表格更新为使用TaskCard */}
        <div className="rounded-md border border-gray-700 overflow-hidden">
          <Table>
            <TableHeader className="bg-gray-900/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">状态</TableHead>
                <TableHead className="w-1/4">名称</TableHead>
                <TableHead className="w-20">类型</TableHead>
                <TableHead className="w-16">总数</TableHead>
                <TableHead className="w-20">时间</TableHead>
                <TableHead className="w-32">进度</TableHead>
                <TableHead className="w-20">筛选</TableHead>
                <TableHead className="w-20">分辨率</TableHead>
                <TableHead className="w-24">操作</TableHead>
              </TableRow>
            </TableHeader>
            <SortableContext
              items={filteredTasks.map((task) => task.id)}
              strategy={verticalListSortingStrategy}
            >
              <TableBody className="bg-gray-800/30">
                {filteredTasks.map(renderTaskRow)}
              </TableBody>
            </SortableContext>
          </Table>
        </div>

        {/* 4. 批量操作和分组UI优化 */}
        {selectedTasks.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-4 right-4 flex gap-2"
          >
            <div className="flex items-center gap-2 bg-gray-800/90 p-2 rounded-lg shadow-lg">
              <span className="text-sm text-gray-300">
                已选择 {selectedTasks.size} 个任务
              </span>
              <Button onClick={() => handleBulkAction("enable")}>
                启用所选
              </Button>
              <Button onClick={() => handleBulkAction("disable")}>
                禁用所选
              </Button>
              <Button onClick={() => setGroupingMode("custom")}>
                创建分组
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleBulkAction("delete")}
              >
                删除所选
              </Button>
            </div>
          </motion.div>
        )}

        {/* 分组管理对话框 */}
        {groupingMode === "custom" && selectedTasks.size > 0 && (
          <TaskGroupingDialog
            selectedTasks={Array.from(selectedTasks)}
            onCreateGroup={createTaskGroup}
            onClose={() => setGroupingMode("none")}
          />
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle>编辑任务</DialogTitle>
            </DialogHeader>
            {editingTask && (
              <TaskEditForm
                task={editingTask}
                onSave={updateTask}
                onCancel={() => setIsDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DndContext>
  );
}

// Updated TaskCard component with proper types
function TaskCard({
  task,
  onEdit,
  onDelete,
  updateTask,
  taskStatus,
}: TaskCardProps) {
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "running":
        return <Play className="w-4 h-4 text-blue-500 animate-pulse" />;
      case "completed":
        return <Check className="w-4 h-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      className="bg-gray-800/50 p-3 rounded-lg border border-gray-700"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Switch
            checked={task.enabled}
            onCheckedChange={(checked) =>
              updateTask?.({ ...task, enabled: checked })
            }
            className="data-[state=checked]:bg-teal-500"
          />
          <span className="text-sm text-white flex items-center gap-1">
            {task.name}
            {taskStatus && getStatusIcon(taskStatus[task.id]?.status)}
          </span>
        </div>
        <div className="flex space-x-1">
          <Button
            size="sm"
            onClick={() => onEdit(task)}
            className="bg-teal-500 text-white"
          >
            编辑
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(task.id)}
            className="bg-red-500 text-white"
          >
            删除
          </Button>
        </div>
      </div>
      <div className="text-sm text-gray-400">
        类型: {task.type} | 总数: {task.total} | 时间: {task.time}
      </div>
      <div className="flex items-center space-x-2">
        <Progress
          value={(task.progress[0] / task.progress[1]) * 100}
          className="h-2 w-full"
        />
        <span className="text-sm">{task.progress.join(" / ")}</span>
      </div>
    </motion.div>
  );
}

// Updated TaskEditForm component with proper types
function TaskEditForm({ task, onSave, onCancel }: TaskEditFormProps) {
  const [editingTask, setEditingTask] = useState<ExposureTask>({
    ...task,
    category: task.category || "default",
    metadata: {
      ...task.metadata,
      camera: {
        // Properly initialize camera object with all required fields
        ...(task.metadata?.camera || {}),
        gain: task.metadata?.camera?.gain || 0,
        offset: task.metadata?.camera?.offset || 0,
        binning: task.metadata?.camera?.binning || "1x1",
        temperature: task.metadata?.camera?.temperature || -10,
        readoutMode: task.metadata?.camera?.readoutMode || "normal",
        usbLimit: task.metadata?.camera?.usbLimit || 40,
        isColorCamera: task.metadata?.camera?.isColorCamera || false,
      },
      filter: {
        // Properly initialize filter object with all required fields
        ...(task.metadata?.filter || {}),
        name: task.metadata?.filter?.name || "",
        offset: task.metadata?.filter?.offset || 0,
        exposure: task.metadata?.filter?.exposure || 0,
      },
    },
    status: {
      ...task.status,
      state: task.status?.state || "pending",
      progress: task.status?.progress || 0,
      attempts: task.status?.attempts || 0,
      logs: task.status?.logs || [],
    },
    settings: {
      ...task.settings,
      dither: task.settings?.dither || false,
      ditherScale: task.settings?.ditherScale || 1,
      focusCheck: task.settings?.focusCheck || false,
      meridianFlip: task.settings?.meridianFlip || false,
      autoGuide: task.settings?.autoGuide || false,
      delay: task.settings?.delay || 0,
      repeat: task.settings?.repeat || 1,
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">名称</Label>
        <Input
          id="name"
          value={editingTask.name}
          onChange={(e) =>
            setEditingTask({ ...editingTask, name: e.target.value })
          }
          className="bg-gray-800 border-gray-700 text-white"
        />
      </div>
      <div>
        <Label htmlFor="type">类型</Label>
        <Select
          value={editingTask.type}
          onValueChange={(value) =>
            setEditingTask({ ...editingTask, type: value })
          }
        >
          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
            <SelectValue placeholder="选择类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LIGHT">LIGHT</SelectItem>
            <SelectItem value="DARK">DARK</SelectItem>
            <SelectItem value="FLAT">FLAT</SelectItem>
            <SelectItem value="BIAS">BIAS</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="total">总数</Label>
        <Input
          id="total"
          type="number"
          value={editingTask.total}
          onChange={(e) =>
            setEditingTask({
              ...editingTask,
              total: parseInt(e.target.value) || 0,
            })
          }
          className="bg-gray-800 border-gray-700 text-white"
        />
      </div>
      <div>
        <Label htmlFor="time">时间</Label>
        <Input
          id="time"
          value={editingTask.time}
          onChange={(e) =>
            setEditingTask({ ...editingTask, time: e.target.value })
          }
          className="bg-gray-800 border-gray-700 text-white"
        />
      </div>
      <div>
        <Label htmlFor="filter">筛选</Label>
        <Input
          id="filter"
          value={editingTask.filter}
          onChange={(e) =>
            setEditingTask({ ...editingTask, filter: e.target.value })
          }
          className="bg-gray-800 border-gray-700 text-white"
        />
      </div>
      <div>
        <Label htmlFor="binning">分辨率</Label>
        <Input
          id="binning"
          value={editingTask.binning}
          onChange={(e) =>
            setEditingTask({ ...editingTask, binning: e.target.value })
          }
          className="bg-gray-800 border-gray-700 text-white"
        />
      </div>
      <div className="flex space-x-2">
        <Button
          onClick={() => onSave(editingTask)}
          className="bg-teal-500 text-white"
        >
          保存更改
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          className="bg-gray-800 border-gray-700 text-white"
        >
          取消
        </Button>
      </div>
    </div>
  );
}
