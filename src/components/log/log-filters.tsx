"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useLogStore } from "@/stores/logStore";
import {
  X,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Tag,
  Settings2,
  AlertCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const animationVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 10 },
};

const LogFilters: React.FC = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const {
    filter,
    setFilter,
    search,
    setSearch,
    logCount,
    setLogCount,
    isPaginationEnabled,
    setIsPaginationEnabled,
    isRealTimeEnabled,
    setIsRealTimeEnabled,
    logLevel,
    setLogLevel,
  } = useLogStore();

  const handleClearFilter = () => {
    setFilter("");
    setSearch("");
    setDateRange(undefined);
    setLogCount(100);
    setLogLevel("all");
    setIsPaginationEnabled(false);
    setIsRealTimeEnabled(true);
  };

  const filterCount = [
    filter ? 1 : 0,
    search ? 1 : 0,
    dateRange ? 1 : 0,
    logLevel !== "all" ? 1 : 0,
    logCount !== 100 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      case "warn":
        return <AlertTriangle className="h-4 w-4" />;
      case "info":
        return <Info className="h-4 w-4" />;
      default:
        return <Filter className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardContent className="p-0 space-y-4">
        <motion.div
          className="flex items-center justify-between"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={animationVariants}
        >
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <motion.span 
              className="text-sm font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              筛选条件 ({filterCount})
            </motion.span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilter}
            disabled={filterCount === 0}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            重置筛选
            <X className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="搜索日志内容..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/50"
            />
          </div>

          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="按标签过滤..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-9 bg-background/50"
              onFocus={() => setShowTagSuggestions(true)}
              onBlur={() => setShowTagSuggestions(false)}
            />
            <AnimatePresence>
              {showTagSuggestions && filter && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute left-0 right-0 top-full mt-1 bg-popover border rounded-md shadow-lg z-10"
                >
                  {/* Tag suggestions would go here */}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Select value={logLevel} onValueChange={setLogLevel}>
            <SelectTrigger className="bg-background/50">
              {getLevelIcon(logLevel)}
              <SelectValue placeholder="日志级别" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  全部
                </div>
              </SelectItem>
              <SelectItem value="error">
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="h-4 w-4" />
                  错误
                </div>
              </SelectItem>
              <SelectItem value="warn">
                <div className="flex items-center gap-2 text-yellow-500">
                  <AlertTriangle className="h-4 w-4" />
                  警告
                </div>
              </SelectItem>
              <SelectItem value="info">
                <div className="flex items-center gap-2 text-blue-500">
                  <Info className="h-4 w-4" />
                  信息
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={cn(
                  "w-full justify-start text-left font-normal bg-background/50",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {dateRange.from.toLocaleDateString()} -{" "}
                      {dateRange.to.toLocaleDateString()}
                    </>
                  ) : (
                    dateRange.from.toLocaleDateString()
                  )
                ) : (
                  "选择日期范围"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </motion.div>

        <motion.div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full bg-muted/50 hover:bg-muted transition-colors"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            高级筛选
            {isAdvancedOpen ? (
              <ChevronUp className="h-4 w-4 ml-2" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-2" />
            )}
          </Button>

          <AnimatePresence>
            {isAdvancedOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 overflow-hidden bg-muted/50 rounded-lg p-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">日志数量限制</Label>
                      <div className="pt-2">
                        <Slider
                          value={[logCount]}
                          onValueChange={([value]) => setLogCount(value)}
                          max={1000}
                          step={100}
                          className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        显示最近 {logCount} 条日志
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>分页显示</Label>
                        <div className="text-xs text-muted-foreground">
                          启用分页可提升大量日志的性能
                        </div>
                      </div>
                      <Switch
                        checked={isPaginationEnabled}
                        onCheckedChange={setIsPaginationEnabled}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>实时更新</Label>
                        <div className="text-xs text-muted-foreground">
                          自动获取最新日志
                        </div>
                      </div>
                      <Switch
                        checked={isRealTimeEnabled}
                        onCheckedChange={setIsRealTimeEnabled}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {filterCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex flex-wrap gap-2"
            >
              {filter && (
                <Badge variant="secondary" className="gap-1">
                  <Tag className="h-3 w-3" />
                  标签: {filter}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => setFilter("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {search && (
                <Badge variant="secondary" className="gap-1">
                  <Search className="h-3 w-3" />
                  搜索: {search}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => setSearch("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {logLevel !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {getLevelIcon(logLevel)}
                  级别: {logLevel}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => setLogLevel("all")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default LogFilters;
