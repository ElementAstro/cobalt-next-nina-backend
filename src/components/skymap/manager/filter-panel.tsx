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
} from "lucide-react";

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
  return (
    <Card className="w-64 dark:bg-gray-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>过滤器</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
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
            className="pl-10"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="space-y-2">
          <Select
            value={filterMode.tag}
            onValueChange={(v) =>
              setFilterMode((prev) => ({ ...prev, tag: v }))
            }
          >
            <SelectTrigger className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <SelectValue placeholder="标签筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                所有标签
              </SelectItem>
              {all_tags.map((tag) => (
                <SelectItem
                  key={tag}
                  value={tag}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  {tag}
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
            <SelectTrigger className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <SelectValue placeholder="标记筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                所有标记
              </SelectItem>
              {all_flags.map((flag) => (
                <SelectItem
                  key={flag}
                  value={flag}
                  className="flex items-center gap-2"
                >
                  <Star className="w-4 h-4" />
                  {flag}
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
            <SelectTrigger className="flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              <SelectValue placeholder="类型筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="flex items-center gap-2">
                <Sliders className="w-4 h-4" />
                所有类型
              </SelectItem>
              <SelectItem value="star" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                恒星
              </SelectItem>
              <SelectItem value="planet" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                行星
              </SelectItem>
              <SelectItem value="galaxy" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                星系
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Button
            variant={showFavorites ? "default" : "outline"}
            className="w-full flex items-center gap-2"
            onClick={() => setShowFavorites(!showFavorites)}
          >
            <Heart className="w-4 h-4" fill={showFavorites ? "currentColor" : "none"} />
            {showFavorites ? "显示所有" : "仅显示收藏"}
          </Button>
          <Button
            variant="outline"
            className="w-full flex items-center gap-2"
            onClick={onBatchMode}
          >
            <List className="w-4 h-4" />
            批量操作
          </Button>
          <Button
            variant="outline"
            className="w-full flex items-center gap-2"
            onClick={onExportAll}
          >
            <Download className="w-4 h-4" />
            导出全部
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FilterPanel;
