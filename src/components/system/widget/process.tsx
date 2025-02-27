// components/widgets/ProcessesWidget.jsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ListTodo, Search, ArrowUpDown, Cpu, MemoryStick } from "lucide-react";
import AnimatedCard from "../animated-card";
import useSystemStore from "@/stores/system/systemStore";
import { useMediaQuery } from "react-responsive";

export default function ProcessesWidget() {
  const { systemInfo } = useSystemStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("cpu");
  const isLandscape = useMediaQuery({ orientation: "landscape" });
  const isMobile = useMediaQuery({ maxWidth: 640 });

  // 格式化内存
  const formatMemory = (mb: number): string => {
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  // 过滤和排序进程
  const filteredProcesses = systemInfo.processes.list
    .filter((process) =>
      process.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "cpu") return b.cpu - a.cpu;
      if (sortBy === "memory") return b.memory - a.memory;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  // 计算最大显示数量，基于屏幕尺寸
  const getMaxProcesses = () => {
    if (isMobile && isLandscape) return 5;
    if (isMobile) return 8;
    return 10;
  };

  const displayedProcesses = filteredProcesses.slice(0, getMaxProcesses());

  return (
    <AnimatedCard>
      <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
        <CardTitle className="text-base sm:text-lg flex items-center gap-1.5 sm:gap-2">
          <ListTodo className="h-4 w-4 sm:h-5 sm:w-5" />
          <span>进程</span>
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          运行进程: {systemInfo.processes.total}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-4">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2 sm:left-2.5 top-2 sm:top-2.5 h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                placeholder="搜索进程..."
                className="pl-7 sm:pl-8 h-7 sm:h-9 text-xs sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-1">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSortBy("cpu")}
                className={`p-1.5 sm:p-2 rounded-md ${
                  sortBy === "cpu"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 hover:bg-muted"
                }`}
                title="按CPU使用率排序"
              >
                <Cpu className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSortBy("memory")}
                className={`p-1.5 sm:p-2 rounded-md ${
                  sortBy === "memory"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 hover:bg-muted"
                }`}
                title="按内存使用排序"
              >
                <MemoryStick className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSortBy("name")}
                className={`p-1.5 sm:p-2 rounded-md ${
                  sortBy === "name"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 hover:bg-muted"
                }`}
                title="按名称排序"
              >
                <ArrowUpDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </motion.button>
            </div>
          </div>

          <div className="rounded-md border">
            <div className="grid grid-cols-12 gap-2 p-1.5 sm:p-2 text-xs font-medium text-muted-foreground bg-muted/50">
              <div className="col-span-6">进程名称</div>
              <div className="col-span-2 text-right">PID</div>
              <div className="col-span-2 text-right">CPU %</div>
              <div className="col-span-2 text-right">内存</div>
            </div>

            <div
              className={`${
                isMobile && isLandscape ? "max-h-[140px]" : "max-h-[280px]"
              } overflow-y-auto`}
            >
              {displayedProcesses.map((process, index) => (
                <motion.div
                  key={process.pid}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="grid grid-cols-12 gap-2 p-1.5 sm:p-2 text-xs sm:text-sm border-t"
                >
                  <div className="col-span-6 truncate">{process.name}</div>
                  <div className="col-span-2 text-right text-muted-foreground">
                    {process.pid}
                  </div>
                  <div className="col-span-2 text-right">
                    <span
                      className={
                        process.cpu > 10 ? "text-amber-500 font-medium" : ""
                      }
                    >
                      {process.cpu.toFixed(1)}%
                    </span>
                  </div>
                  <div className="col-span-2 text-right text-muted-foreground">
                    {formatMemory(process.memory)}
                  </div>
                </motion.div>
              ))}

              {filteredProcesses.length === 0 && (
                <div className="p-3 text-center text-xs sm:text-sm text-muted-foreground">
                  没有找到匹配的进程
                </div>
              )}

              {filteredProcesses.length > displayedProcesses.length && (
                <div className="p-1.5 text-center text-xs text-muted-foreground border-t">
                  显示前 {displayedProcesses.length} 项（共{" "}
                  {filteredProcesses.length} 项）
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </AnimatedCard>
  );
}
