"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { motion } from "framer-motion";

interface TargetFiltersProps {
  filters: {
    search: string;
    type: string;
    category: string;
    sortBy: string;
    sortOrder: "asc" | "desc";
  };
  onChange: (filters: any) => void;
  onReset: () => void;
}

export function TargetFilters({
  filters,
  onChange,
  onReset,
}: TargetFiltersProps) {
  return (
    <motion.div
      className="bg-gray-900/50 p-2 rounded-lg"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4" />
          <Label className="text-sm">过滤选项</Label>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="h-7 px-2 text-gray-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
        <div className="col-span-2 md:col-span-1">
          <Input
            placeholder="搜索目标..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="h-8 bg-gray-800/50"
          />
        </div>

        <Select
          value={filters.type}
          onValueChange={(value) => onChange({ ...filters, type: value })}
        >
          <SelectTrigger className="h-8 bg-gray-800/50">
            <SelectValue placeholder="类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="galaxy">星系</SelectItem>
            <SelectItem value="nebula">星云</SelectItem>
            <SelectItem value="cluster">星团</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.sortBy}
          onValueChange={(value) => onChange({ ...filters, sortBy: value })}
        >
          <SelectTrigger className="h-8 bg-gray-800/50">
            <SelectValue placeholder="排序" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">名称</SelectItem>
            <SelectItem value="type">类型</SelectItem>
            <SelectItem value="date">日期</SelectItem>
            <SelectItem value="progress">进度</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.sortOrder}
          onValueChange={(value: "asc" | "desc") =>
            onChange({ ...filters, sortOrder: value })
          }
        >
          <SelectTrigger className="h-8 bg-gray-800/50">
            <SelectValue placeholder="排序方向" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">升序</SelectItem>
            <SelectItem value="desc">降序</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </motion.div>
  );
}
