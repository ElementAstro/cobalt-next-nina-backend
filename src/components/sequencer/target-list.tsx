"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, CoordinateData, ExposureTask } from "@/types/sequencer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash, Edit, Search, Plus, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "./sortable-item";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useSequencerStore } from "@/stores/sequencer";

type TargetListProps = Record<string, never>;

export function TargetList({}: TargetListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("全部");
  const [showSettings, setShowSettings] = useState(false);

  const { targets, updateTarget, activeTargetId } = useSequencerStore();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = targets.findIndex((t) => t.id === active.id);
      const newIndex = targets.findIndex((t) => t.id === over.id);
      const newOrder = arrayMove(targets, oldIndex, newIndex);
      console.log("New target order:", newOrder);
      // 此处可调用存储方法更新targets顺序
    }
  };

  const filteredTargets = targets.filter((target) => {
    const matchQuery = target.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchFilter = filter === "全部" || target.category === filter;
    return matchQuery && matchFilter;
  });

  // Helper: Map target.coordinates (CoordinateData) to the shape expected by CoordinateInput
  const mapCoordinates = (coord?: CoordinateData) => {
    return {
      ra: {
        h: coord?.ra?.h ?? 0,
        m: coord?.ra?.m ?? 0,
        s: coord?.ra?.s ?? 0,
      },
      dec: {
        d: coord?.dec?.d ?? 0,
        m: coord?.dec?.m ?? 0,
        s: coord?.dec?.s ?? 0,
      },
    };
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 flex items-center gap-2">
          <Input
            placeholder="搜索目标..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button size="sm" variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="w-40">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger>
              <SelectValue placeholder="筛选类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="全部">全部</SelectItem>
              <SelectItem value="类型A">类型A</SelectItem>
              <SelectItem value="类型B">类型B</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={() => console.log("Add target")}>
          <Plus className="h-4 w-4" />
        </Button>
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>设置</DialogTitle>
            </DialogHeader>
            <div className="p-4">
              <p>在此处添加设置内容</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={filteredTargets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1 p-1">
              {filteredTargets.map((target) => (
                <SortableItem key={target.id} value={target.id}>
                  <motion.div layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                    <Card
                      className={`cursor-pointer hover:bg-gray-800/50 transition-colors border ${
                        target.id === activeTargetId ? "border-teal-500" : "border-gray-700"
                      }`}
                      onClick={() =>
                        updateTarget(target.id, {
                          id: target.id,
                          name: target.name,
                          coordinates: target.coordinates,
                          tasks: target.tasks,
                        })
                      }
                    >
                      <CardHeader className="p-2">
                        <CardTitle className="text-sm truncate">{target.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="p-2">
                        <Accordion type="single" collapsible>
                          <AccordionItem value="details">
                            <AccordionTrigger>详情</AccordionTrigger>
                            <AccordionContent>
                              <CoordinateInput
                                label="RA"
                                value={mapCoordinates(target.coordinates)}
                                onChange={(val) => console.log("RA changed", val)}
                              />
                              <CoordinateInput
                                label="Dec"
                                value={mapCoordinates(target.coordinates)}
                                onChange={(val) => console.log("Dec changed", val)}
                              />
                              {target.tasks && target.tasks.length > 0 && (
                                <TaskList
                                  tasks={target.tasks as ExposureTask[]}
                                  onAddTask={() => console.log("Add task")}
                                  onUpdateTasks={(tasks) => console.log("Update tasks", tasks)}
                                />
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </CardContent>
                    </Card>
                  </motion.div>
                </SortableItem>
              ))}
            </div>
          </AnimatePresence>
        </SortableContext>
      </DndContext>
    </div>
  );
}

// 更新CoordinateInput的接口定义
interface CoordinateInputProps {
  label: "RA" | "Dec";
  value: {
    ra?: { h: number; m: number; s: number };
    dec?: { d: number; m: number; s: number };
  };
  onChange: (value: Partial<CoordinateData>) => void;
}

function CoordinateInput({ label, value, onChange }: CoordinateInputProps) {
  const isRA = label === "RA";
  const coords = isRA ? value.ra : value.dec;

  return (
    <div className="mb-2">
      <Label className="text-dark-400">{label}</Label>
      <div className="flex space-x-2">
        <Input
          type="number"
          value={isRA ? (coords?.h ?? 0) : (coords?.d ?? 0)}
          onChange={(e) =>
            onChange({
              [isRA ? 'ra' : 'dec']: {
                ...coords,
                [isRA ? 'h' : 'd']: Number(e.target.value)
              }
            })
          }
          className="w-16 bg-dark-700 text-dark-200"
          placeholder={isRA ? "时" : "度"}
        />
        <Input
          type="number"
          value={coords?.m ?? 0}
          onChange={(e) =>
            onChange({
              [isRA ? 'ra' : 'dec']: {
                ...coords,
                m: Number(e.target.value)
              }
            })
          }
          className="w-16 bg-dark-700 text-dark-200"
          placeholder="分"
        />
        <Input
          type="number"
          value={coords?.s ?? 0}
          onChange={(e) =>
            onChange({
              [isRA ? 'ra' : 'dec']: {
                ...coords,
                s: Number(e.target.value)
              }
            })
          }
          className="w-16 bg-dark-700 text-dark-200"
          placeholder="秒"
        />
      </div>
    </div>
  );
}

interface TaskListProps {
  tasks: ExposureTask[];
  onAddTask: () => void;
  onUpdateTasks: (tasks: ExposureTask[]) => void;
}

function TaskList({ tasks, onAddTask, onUpdateTasks }: TaskListProps) {
  const editTask = (taskId: string, newName: string, newDuration: number) => {
    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, name: newName, duration: newDuration } : task
    );
    onUpdateTasks(updatedTasks);
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== taskId);
    onUpdateTasks(updatedTasks);
  };

  return (
    <ul className="space-y-2 mt-2">
      {tasks.map((task) => (
        <li key={task.id} className="flex flex-col bg-gray-800/50 p-3 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={task.enabled}
                onCheckedChange={(checked) => {
                  const updatedTasks = tasks.map((t) =>
                    t.id === task.id ? { ...t, enabled: checked } : t
                  );
                  onUpdateTasks(updatedTasks);
                }}
              />
              <span className="text-sm font-medium">{task.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  const newName = prompt("输入新的任务名称", task.name);
                  const newDuration = Number(prompt("输入新的持续时间（秒）", task.duration.toString()));
                  if (newName && !isNaN(newDuration)) {
                    editTask(task.id, newName, newDuration);
                  }
                }}
                className="h-8 px-2"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deleteTask(task.id)}
                className="h-8 px-2"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
            <div>
              <span>总数: </span>
              <span className="text-white">{task.total}</span>
            </div>
            <div>
              <span>时间: </span>
              <span className="text-white">{task.time}</span>
            </div>
            <div>
              <span>进度: </span>
              <span className="text-white">{task.progress.join("/")}</span>
            </div>
          </div>
          <div className="mt-2">
            <Progress value={(task.progress[0] / task.progress[1]) * 100} className="h-1" />
          </div>
        </li>
      ))}
      <Button size="sm" onClick={onAddTask} className="mt-2">
        新增任务
      </Button>
    </ul>
  );
}