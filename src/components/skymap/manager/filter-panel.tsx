import React, { FC } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  List,
  Download,
  Sliders,
  Star,
  Globe,
  Sparkles,
  Search,
  Filter,
  Heart,
  Flag,
} from "lucide-react";
import { motion } from "framer-motion";

interface FilterMode {
  tag: string;
  flag: string;
  type: string;
  search_query: string;
}

interface FilterPanelProps {
  filterMode: FilterMode;
  setFilterMode: React.Dispatch<React.SetStateAction<FilterMode>>;
  all_tags: string[];
  all_flags: string[];
  onBatchMode: () => void;
  onExportAll: () => void;
  showFavorites: boolean;
  setShowFavorites: (show: boolean) => void;
}

const FilterPanel: FC<FilterPanelProps> = ({
  filterMode,
  setFilterMode,
  all_tags,
  all_flags,
  onBatchMode,
  onExportAll,
  showFavorites,
  setShowFavorites,
}) => {
  const containerVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <Card className="w-full md:w-64 dark:bg-gray-900/90 backdrop-blur-md border-gray-800 shadow-lg transition-all duration-300 hover:shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl font-semibold text-indigo-400 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          过滤器
        </CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {/* 搜索框 */}
          <motion.div variants={itemVariants} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="搜索目标名称..."
              value={filterMode.search_query}
              onChange={(e) =>
                setFilterMode((prev) => ({
                  ...prev,
                  search_query: e.target.value,
                }))
              }
              className="pl-10 bg-gray-800/50 border-gray-700 focus:border-indigo-500 transition-all duration-300"
            />
          </motion.div>

          {/* 筛选选项 */}
          <motion.div variants={itemVariants} className="space-y-3">
            <Select
              value={filterMode.tag}
              onValueChange={(v) => setFilterMode((prev) => ({ ...prev, tag: v }))}
            >
              <SelectTrigger className="w-full bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 transition-colors duration-200">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <SelectValue placeholder="标签筛选" />
                </div>
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 border-gray-700">
                <SelectItem value="all" className="focus:bg-gray-700/50">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    所有标签
                  </div>
                </SelectItem>
                {all_tags.map((tag) => (
                  <SelectItem
                    key={tag}
                    value={tag}
                    className="focus:bg-gray-700/50"
                  >
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      {tag}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterMode.flag}
              onValueChange={(v) =>
                setFilterMode((prev) => ({ ...prev, flag: v }))
              }
            >
              <SelectTrigger className="w-full bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 transition-colors duration-200">
                <div className="flex items-center gap-2">
                  <Flag className="w-4 h-4 text-green-400" />
                  <SelectValue placeholder="标记筛选" />
                </div>
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 border-gray-700">
                <SelectItem value="all" className="focus:bg-gray-700/50">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    所有标记
                  </div>
                </SelectItem>
                {all_flags.map((flag) => (
                  <SelectItem
                    key={flag}
                    value={flag}
                    className="focus:bg-gray-700/50"
                  >
                    <div className="flex items-center gap-2">
                      <Flag className="w-4 h-4 text-green-400" />
                      {flag}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filterMode.type}
              onValueChange={(v) =>
                setFilterMode((prev) => ({ ...prev, type: v }))
              }
            >
              <SelectTrigger className="w-full bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 transition-colors duration-200">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <SelectValue placeholder="类型筛选" />
                </div>
              </SelectTrigger>
              <SelectContent className="dark:bg-gray-800 border-gray-700">
                <SelectItem value="all" className="focus:bg-gray-700/50">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    所有类型
                  </div>
                </SelectItem>
                <SelectItem value="star" className="focus:bg-gray-700/50">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    恒星
                  </div>
                </SelectItem>
                <SelectItem value="planet" className="focus:bg-gray-700/50">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    行星
                  </div>
                </SelectItem>
                <SelectItem value="galaxy" className="focus:bg-gray-700/50">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    星系
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* 操作按钮 */}
          <motion.div variants={itemVariants} className="space-y-2 pt-2">
            <Button
              variant={showFavorites ? "default" : "outline"}
              className="w-full bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 transition-all duration-300 group"
              onClick={() => setShowFavorites(!showFavorites)}
            >
              <Heart
                className={`w-4 h-4 mr-2 transition-colors duration-300 ${
                  showFavorites ? "text-red-400" : "group-hover:text-red-400"
                }`}
                fill={showFavorites ? "currentColor" : "none"}
              />
              {showFavorites ? "显示所有" : "仅显示收藏"}
            </Button>
            <Button
              variant="outline"
              className="w-full bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 transition-all duration-300 group"
              onClick={onBatchMode}
            >
              <List className="w-4 h-4 mr-2 group-hover:text-indigo-400 transition-colors duration-300" />
              批量操作
            </Button>
            <Button
              variant="outline"
              className="w-full bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 transition-all duration-300 group"
              onClick={onExportAll}
            >
              <Download className="w-4 h-4 mr-2 group-hover:text-purple-400 transition-colors duration-300" />
              导出全部
            </Button>
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default FilterPanel;
