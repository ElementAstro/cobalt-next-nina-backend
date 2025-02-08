"use client";

import { useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

import { CelestialObjectCard } from "./celestial-object-card";
import { SearchBar } from "./search-bar";
import { FilterPanel } from "./filter-panel";
import useSearchStore from "@/stores/skymap/searchStore";
import { CelestialObject } from "@/types/skymap/search";
import { PaginationWrapper } from "./pagination-wrapper";
import { RealTimeData } from "./realtime-data";

// 假设我们有一个更大的模拟数据集
const mockObjects: CelestialObject[] = Array.from({ length: 1000 }, (_, i) => ({
  id: (i + 1).toString(),
  name: `Celestial Object ${i + 1}`,
  type: ["OPNCL", "DRKNB", "BRTNB", "GALXY", "PLNTN", "STAR"][
    Math.floor(Math.random() * 6)
  ],
  constellation: ["UMA", "CYG", "PYX", "ORI", "CAS", "LEO"][
    Math.floor(Math.random() * 6)
  ],
  rightAscension: `${Math.floor(Math.random() * 24)}:${Math.floor(
    Math.random() * 60
  )}:${Math.floor(Math.random() * 60)}`,
  declination: `${Math.floor(Math.random() * 90)}° ${Math.floor(
    Math.random() * 60
  )}' ${Math.floor(Math.random() * 60)}"`,
  magnitude: Math.random() * 100,
  size: Math.floor(Math.random() * 1000),
  distance: Math.floor(Math.random() * 10000),
  riseTime: `${Math.floor(Math.random() * 24)}:${Math.floor(
    Math.random() * 60
  )}`,
  setTime: `${Math.floor(Math.random() * 24)}:${Math.floor(
    Math.random() * 60
  )}`,
  transitTime: `${Math.floor(Math.random() * 24)}:${Math.floor(
    Math.random() * 60
  )}`,
  transitAltitude: Math.floor(Math.random() * 90),
  thumbnail: null,
}));

const ITEMS_PER_PAGE = 10;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function StarSearch() {
  const {
    searchTerm,
    filters,
    sortBy,
    sortOrder,
    currentPage,
    objects,
    setSearchTerm,
    setSortBy,
    setSortOrder,
    setCurrentPage,
    fetchObjects,
  } = useSearchStore();

  useEffect(() => {
    fetchObjects();
  }, [fetchObjects]);

  const filteredObjects = useMemo(() => {
    return objects.filter((obj) => {
      const matchesTerm =
        obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.constellation.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesConstellation =
        filters.constellations.length === 0 ||
        filters.constellations.includes(obj.constellation);
      const matchesType =
        filters.types.length === 0 || filters.types.includes(obj.type);
      const matchesMagnitude =
        (!filters.minMagnitude || obj.magnitude >= filters.minMagnitude) &&
        (!filters.maxMagnitude || obj.magnitude <= filters.maxMagnitude);
      const matchesDistance =
        (!filters.minDistance || obj.distance >= filters.minDistance) &&
        (!filters.maxDistance || obj.distance <= filters.maxDistance);
      return (
        matchesTerm &&
        matchesConstellation &&
        matchesType &&
        matchesMagnitude &&
        matchesDistance
      );
    });
  }, [objects, searchTerm, filters]);

  const sortedObjects = useMemo(() => {
    return [...filteredObjects].sort((a, b) => {
      const valueA = a[sortBy as keyof CelestialObject];
      const valueB = b[sortBy as keyof CelestialObject];
      if (typeof valueA === "string" && typeof valueB === "string") {
        return sortOrder === "asc"
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      } else if (typeof valueA === "number" && typeof valueB === "number") {
        return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
      } else {
        return 0;
      }
    });
  }, [filteredObjects, sortBy, sortOrder]);

  const paginatedObjects = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedObjects.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedObjects, currentPage]);

  const totalPages = Math.ceil(sortedObjects.length / ITEMS_PER_PAGE);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden bg-background">
      {/* 左侧过滤器面板 - 桌面端显示为侧边栏，平板/手机端折叠到顶部 */}
      <motion.div
        variants={itemVariants}
        className="hidden lg:block lg:w-64 lg:border-r border-border overflow-y-auto shrink-0"
      >
        <div className="sticky top-0 p-4">
          <FilterPanel />
        </div>
      </motion.div>

      {/* 主内容区 */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col min-h-0 min-w-0"
      >
        {/* 顶部搜索栏 - 固定定位 */}
        <motion.div
          variants={itemVariants}
          className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b"
        >
          <div className="p-2 flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <SearchBar onSearch={handleSearch} items={mockObjects} />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="排序" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">名称</SelectItem>
                  <SelectItem value="magnitude">星等</SelectItem>
                  <SelectItem value="distance">距离</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                }
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>
              {/* 移动端过滤器按钮和弹窗 */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="lg:hidden max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>筛选器</DialogTitle>
                  </DialogHeader>
                  <FilterPanel />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </motion.div>

        {/* 搜索结果列表 */}
        <motion.div variants={itemVariants} className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-2 p-2"
            >
              <AnimatePresence>
                {paginatedObjects.map((item) => (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    className="w-full"
                  >
                    <CelestialObjectCard
                      {...item}
                      isLoggedIn={false}
                      thumbnail=""
                      cardStyle="compact"
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
            <div className="sticky bottom-0 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
              <PaginationWrapper
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </ScrollArea>
        </motion.div>
      </motion.div>

      {/* 右侧实时数据面板 */}
      <motion.div
        variants={itemVariants}
        className="hidden lg:block lg:w-72 lg:border-l border-border overflow-y-auto shrink-0"
      >
        <div className="sticky top-0 p-4">
          <RealTimeData theme="compact" />
        </div>
      </motion.div>
    </div>
  );
}
