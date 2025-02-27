import React, { FC, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import TargetSmallCard from "./target-small";
import { List, Grid, SortAsc, SortDesc, Search, Loader2 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { IDSOFramingObjectInfo } from "@/types/skymap";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface TargetListProps {
  targets: IDSOFramingObjectInfo[];
  viewMode: "grid" | "list";
  batchMode: boolean;
  selectedTargets: number[];
  setSelectedTargets: React.Dispatch<React.SetStateAction<number[]>>;
  onCardChecked: (index: number, checked: boolean) => void;
  onChoiceMaken: (() => void) | null;
  setViewMode: React.Dispatch<React.SetStateAction<"grid" | "list">>;
  sortField: "name" | "type" | "tag" | "flag";
  setSortField: React.Dispatch<
    React.SetStateAction<"name" | "type" | "tag" | "flag">
  >;
  sortOrder: "asc" | "desc";
  setSortOrder: React.Dispatch<React.SetStateAction<"asc" | "desc">>;
  favorites: string[];
  onFavoriteClick: (target: IDSOFramingObjectInfo) => void;
}

const TargetList: FC<TargetListProps> = ({
  targets,
  viewMode,
  batchMode,
  selectedTargets,
  setSelectedTargets,
  onCardChecked,
  onChoiceMaken,
  setViewMode,
  sortField,
  setSortField,
  sortOrder,
  setSortOrder,
  favorites,
  onFavoriteClick,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  // 模拟加载状态
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [viewMode, sortField, sortOrder]);

  // 监听滚动
  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const scrollTop = target.scrollTop;
    setScrollPosition(scrollTop);
    setShowScrollToTop(scrollTop > 300);
  };

  // 滚动到顶部
  const scrollToTop = () => {
    const scrollArea = document.querySelector('[data-targets-scroll-area]');
    if (scrollArea) {
      scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
    exit: { opacity: 0 },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2,
      },
    },
  };

  const EmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-8 text-gray-400"
    >
      <Search className="w-12 h-12 mb-4 opacity-50" />
      <h3 className="text-lg font-medium mb-2">暂无目标</h3>
      <p className="text-sm text-center">
        没有找到符合条件的目标
        <br />
        请尝试调整筛选条件
      </p>
    </motion.div>
  );

  const LoadingState = () => (
    <div className="space-y-4 p-4">
      {Array.from({ length: viewMode === 'grid' ? 6 : 4 }).map((_, i) => (
        <div key={i} className={viewMode === 'grid' ? "flex-1" : "w-full"}>
          <Skeleton className="h-[150px] w-full bg-gray-800/50 rounded-lg" />
        </div>
      ))}
    </div>
  );

  return (
    <Card className="dark:bg-gray-900/90 backdrop-blur-md border-gray-800 relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-semibold text-indigo-400 flex items-center gap-2">
          <motion.span
            initial={{ rotate: 0 }}
            animate={{
              rotate: isLoading ? [0, 180, 360] : 0,
            }}
            transition={{
              duration: 2,
              ease: "linear",
              repeat: isLoading ? Infinity : 0,
            }}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </motion.span>
          目标列表
          {targets.length > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-900/50 text-indigo-300"
            >
              {targets.length}
            </motion.span>
          )}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setViewMode(viewMode === "grid" ? "list" : "grid");
                toast.info(
                  viewMode === "grid" ? "已切换到列表视图" : "已切换到网格视图", 
                  {
                    icon: viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />,
                    duration: 2000,
                  }
                );
              }}
              className={cn(
                "transition-colors duration-200",
                "hover:bg-gray-800",
                "flex items-center gap-2"
              )}
            >
              {viewMode === "grid" ? (
                <>
                  <List className="w-4 h-4" />
                  列表视图
                </>
              ) : (
                <>
                  <Grid className="w-4 h-4" />
                  网格视图
                </>
              )}
            </Button>
          </motion.div>

          <Select
            value={sortField}
            onValueChange={(value: "name" | "type" | "tag" | "flag") => {
              setSortField(value);
              toast.info(`按${
                value === "name" ? "名称" : 
                value === "type" ? "类型" : 
                value === "tag" ? "标签" : "标记"
              }排序`, {
                duration: 2000,
              });
            }}
          >
            <SelectTrigger className="w-[120px] bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 transition-all duration-200">
              <SelectValue placeholder="排序方式" />
            </SelectTrigger>
            <SelectContent className="dark:bg-gray-800 border-gray-700">
              <SelectItem value="name">名称</SelectItem>
              <SelectItem value="type">类型</SelectItem>
              <SelectItem value="tag">标签</SelectItem>
              <SelectItem value="flag">标记</SelectItem>
            </SelectContent>
          </Select>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                toast.info(
                  `已切换到${sortOrder === "asc" ? "降序" : "升序"}排列`, 
                  {
                    duration: 2000,
                  }
                );
              }}
              className="hover:bg-gray-800 transition-colors duration-200"
            >
              {sortOrder === "asc" ? (
                <SortAsc className="w-4 h-4" />
              ) : (
                <SortDesc className="w-4 h-4" />
              )}
            </Button>
          </motion.div>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea 
          className="h-[calc(80vh-8rem)]"
          data-targets-scroll-area
          onScrollCapture={handleScroll}
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <LoadingState />
            ) : targets.length === 0 ? (
              <EmptyState />
            ) : (
              <motion.div
                key={viewMode}
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {targets.map((target, index) => (
                      <motion.div
                        key={target.name + index}
                        variants={itemVariants}
                        layoutId={target.name}
                      >
                        <TargetSmallCard
                          target_info={target}
                          on_card_clicked={onCardChecked}
                          card_index={index}
                          on_choice_maken={onChoiceMaken}
                          in_manage={true}
                          is_favorite={favorites.includes(target.name)}
                          on_favorite_clicked={onFavoriteClick}
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {targets.map((target, index) => (
                      <motion.div
                        key={target.name + index}
                        variants={itemVariants}
                        layoutId={target.name}
                      >
                        <Card className="dark:bg-gray-800/50 hover:bg-gray-700/50 transition-all duration-200">
                          <CardHeader className="p-3 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                              {batchMode && (
                                <Checkbox
                                  checked={selectedTargets.includes(index)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedTargets([...selectedTargets, index]);
                                    } else {
                                      setSelectedTargets(
                                        selectedTargets.filter((i) => i !== index)
                                      );
                                    }
                                  }}
                                />
                              )}
                              <CardTitle className="text-sm flex items-center gap-2">
                                {target.name}
                                {target.tag && (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-indigo-900/30 text-indigo-300">
                                    {target.tag}
                                  </span>
                                )}
                                {target.flag && (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-900/30 text-green-300">
                                    {target.flag}
                                  </span>
                                )}
                              </CardTitle>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => onFavoriteClick(target)}
                              className={cn(
                                "text-gray-400 hover:text-red-400 transition-colors duration-200",
                                favorites.includes(target.name) && "text-red-400"
                              )}
                            >
                              {favorites.includes(target.name) ? "★" : "☆"}
                            </motion.button>
                          </CardHeader>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 滚动到顶部按钮 */}
          <AnimatePresence>
            {showScrollToTop && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                className="sticky bottom-4 flex justify-center"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={scrollToTop}
                  className="rounded-full bg-gray-800 hover:bg-gray-700 border-gray-700 shadow-lg"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="mr-1"
                  >
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                  返回顶部
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
        
        {/* 滚动进度指示器 */}
        <motion.div
          className="h-0.5 bg-indigo-500/50 absolute bottom-0 left-0"
          style={{ 
            scaleX: scrollPosition / 1000, 
            transformOrigin: 'left',
            opacity: scrollPosition > 50 ? 1 : 0 
          }}
          transition={{ duration: 0.2 }}
        />
      </CardContent>
    </Card>
  );
};

export default TargetList;
