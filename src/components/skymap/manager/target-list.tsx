import React, { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import TargetSmallCard from "./target-small";
import { List, Grid, SortAsc, SortDesc } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { IDSOFramingObjectInfo } from "@/types/skymap";

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
  return (
    <Card className="dark:bg-gray-800/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>目标列表</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? (
              <>
                <List className="w-4 h-4 mr-2" />
                列表视图
              </>
            ) : (
              <>
                <Grid className="w-4 h-4 mr-2" />
                网格视图
              </>
            )}
          </Button>
          <Select
            value={sortField}
            onValueChange={(value: "name" | "type" | "tag" | "flag") =>
              setSortField(value)
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="排序方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">名称</SelectItem>
              <SelectItem value="type">类型</SelectItem>
              <SelectItem value="tag">标签</SelectItem>
              <SelectItem value="flag">标记</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? (
              <SortAsc className="w-4 h-4" />
            ) : (
              <SortDesc className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(80vh-8rem)]">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {targets.map((target, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 300,
                  }}
                  className="cursor-pointer"
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
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ x: 5 }}
                  transition={{
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 300,
                  }}
                  className="cursor-pointer"
                >
                  <Card className="dark:bg-gray-800">
                    <CardHeader className="p-3 flex justify-between items-center">
                      <CardTitle className="text-sm">{target.name}</CardTitle>
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
                    </CardHeader>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default TargetList;
