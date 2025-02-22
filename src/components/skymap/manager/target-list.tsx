import React, { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import TargetSmallCard from "./target-small";
import { List, Grid, SortAsc, SortDesc, Search } from "lucide-react";
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

  return (
    <Card className="dark:bg-gray-900/90 backdrop-blur-md border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl font-semibold text-indigo-400">目标列表</CardTitle>
        <div className="flex items-center space-x-2">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
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
            onValueChange={(value: "name" | "type" | "tag" | "flag") =>
              setSortField(value)
            }
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
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
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
        <ScrollArea className="h-[calc(80vh-8rem)]">
          <AnimatePresence mode="wait">
            {targets.length === 0 ? (
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
                              <CardTitle className="text-sm">{target.name}</CardTitle>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => onFavoriteClick(target)}
                              className="text-gray-400 hover:text-red-400 transition-colors duration-200"
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
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TargetList;
