import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sliders, RefreshCw, Tag } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import useSearchStore from "@/stores/skymap/searchStore";

const CONSTELLATIONS = [
  ["UMA", "大熊座"],
  ["CYG", "天鹅座"],
  ["PYX", "罗盘座"],
  ["ORI", "猎户座"],
  ["CAS", "仙后座"],
  ["LEO", "狮子座"],
  ["AQR", "宝瓶座"],
  ["SCO", "天蝎座"],
  ["TAU", "金牛座"],
  ["VIR", "室女座"],
] as const;

const OBJECT_TYPES = [
  ["OPNCL", "疏散星团", "Open Cluster"],
  ["DRKNB", "暗星云", "Dark Nebula"],
  ["BRTNB", "发射星云", "Bright Nebula"],
  ["GALXY", "星系", "Galaxy"],
  ["PLNTN", "行星状星云", "Planetary Nebula"],
  ["STAR", "恒星", "Star"],
  ["ASTER", "小行星", "Asteroid"],
  ["COMET", "彗星", "Comet"],
  ["NOVA", "新星", "Nova"],
] as const;

interface FilterType {
  constellations: string[];
  types: string[];
  minMagnitude: number;
  maxMagnitude: number;
  minDistance: number;
  maxDistance: number;
}

type FilterKeys = keyof FilterType;

const containerVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

export function FilterPanel() {
  const { filters, setFilters } = useSearchStore();
  const [search, setSearch] = useState("");

  const handleFilterChange = (
    key: FilterKeys,
    value: (typeof filters)[FilterKeys]
  ) => {
    setFilters({ ...filters, [key]: value });
  };

  const handleCheckboxChange = (
    key: "constellations" | "types",
    value: string
  ) => {
    const currentValues = filters[key];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    handleFilterChange(key, newValues);
  };

  const handleSliderChange = (
    key: "minMagnitude" | "maxMagnitude" | "minDistance" | "maxDistance",
    value: number[]
  ) => {
    handleFilterChange(key, value[0]);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value.toLowerCase());
  };

  const filteredConstellations = CONSTELLATIONS.filter(
    ([code, name]) =>
      code.toLowerCase().includes(search) ||
      name.toLowerCase().includes(search)
  );

  const filteredObjectTypes = OBJECT_TYPES.filter(
    ([code, name, english]) =>
      code.toLowerCase().includes(search) ||
      name.toLowerCase().includes(search) ||
      english.toLowerCase().includes(search)
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* 搜索框 */}
      <Card className="bg-background/60 backdrop-blur-sm border-border/50">
        <CardContent className="p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索过滤项..."
              value={search}
              onChange={handleSearchChange}
              className="pl-8 h-9 bg-background/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* 过滤器内容 */}
      <Card className="bg-background/60 backdrop-blur-sm border-border/50">
        <CardContent className="p-3">
          <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
            <Accordion type="single" collapsible className="space-y-2">
              {/* 星座过滤器 */}
              <AccordionItem value="constellations" className="border-border/50">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4" />
                    <span>星座</span>
                    {filters.constellations.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {filters.constellations.length}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <AnimatePresence>
                    <motion.div
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-2 gap-2"
                    >
                      {filteredConstellations.map(([code, name]) => (
                        <TooltipProvider key={code}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`constellation-${code}`}
                                  checked={filters.constellations.includes(code)}
                                  onCheckedChange={() =>
                                    handleCheckboxChange("constellations", code)
                                  }
                                />
                                <Label
                                  htmlFor={`constellation-${code}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {code}
                                </Label>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{name}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </AccordionContent>
              </AccordionItem>

              {/* 天体类型过滤器 */}
              <AccordionItem value="types" className="border-border/50">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    <span>天体类型</span>
                    {filters.types.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {filters.types.length}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <AnimatePresence>
                    <motion.div
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid grid-cols-2 gap-2"
                    >
                      {filteredObjectTypes.map(([code, name, english]) => (
                        <TooltipProvider key={code}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`type-${code}`}
                                  checked={filters.types.includes(code)}
                                  onCheckedChange={() =>
                                    handleCheckboxChange("types", code)
                                  }
                                />
                                <Label
                                  htmlFor={`type-${code}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {code}
                                </Label>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{name}</p>
                              <p className="text-xs text-muted-foreground">
                                {english}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </AccordionContent>
              </AccordionItem>

              {/* 星等过滤器 */}
              <AccordionItem value="magnitude" className="border-border/50">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4" />
                    <span>星等</span>
                    {(filters.minMagnitude > -30 || filters.maxMagnitude < 30) && (
                      <Badge variant="secondary" className="ml-2">
                        已筛选
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>最小星等</Label>
                        <span className="text-sm font-medium">
                          {filters.minMagnitude}
                        </span>
                      </div>
                      <Slider
                        min={-30}
                        max={30}
                        step={0.1}
                        value={[filters.minMagnitude]}
                        onValueChange={(value) =>
                          handleSliderChange("minMagnitude", value)
                        }
                        className="my-4"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>最大星等</Label>
                        <span className="text-sm font-medium">
                          {filters.maxMagnitude}
                        </span>
                      </div>
                      <Slider
                        min={-30}
                        max={30}
                        step={0.1}
                        value={[filters.maxMagnitude]}
                        onValueChange={(value) =>
                          handleSliderChange("maxMagnitude", value)
                        }
                        className="my-4"
                      />
                    </div>
                  </motion.div>
                </AccordionContent>
              </AccordionItem>

              {/* 距离过滤器 */}
              <AccordionItem value="distance" className="border-border/50">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4" />
                    <span>距离 (光年)</span>
                    {(filters.minDistance > 0 ||
                      filters.maxDistance < 1000000) && (
                      <Badge variant="secondary" className="ml-2">
                        已筛选
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>最小距离</Label>
                        <span className="text-sm font-medium">
                          {filters.minDistance} ly
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={1000000}
                        step={100}
                        value={[filters.minDistance]}
                        onValueChange={(value) =>
                          handleSliderChange("minDistance", value)
                        }
                        className="my-4"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>最大距离</Label>
                        <span className="text-sm font-medium">
                          {filters.maxDistance} ly
                        </span>
                      </div>
                      <Slider
                        min={0}
                        max={1000000}
                        step={100}
                        value={[filters.maxDistance]}
                        onValueChange={(value) =>
                          handleSliderChange("maxDistance", value)
                        }
                        className="my-4"
                      />
                    </div>
                  </motion.div>
                </AccordionContent>
              </AccordionItem>

              {/* 高级选项 */}
              <AccordionItem value="advanced" className="border-border/50">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Sliders className="h-4 w-4" />
                    <span>高级选项</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <motion.div
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label>最佳观测时间</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="选择时间" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sunset">日落时分</SelectItem>
                          <SelectItem value="midnight">午夜</SelectItem>
                          <SelectItem value="sunrise">日出时分</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>大气条件</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="选择条件" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">极好</SelectItem>
                          <SelectItem value="good">良好</SelectItem>
                          <SelectItem value="fair">一般</SelectItem>
                          <SelectItem value="poor">较差</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* 重置按钮 */}
      <Card className="bg-background/60 backdrop-blur-sm border-border/50">
        <CardContent className="p-3">
          <Button
            onClick={() =>
              setFilters({
                constellations: [],
                types: [],
                minMagnitude: -30,
                maxMagnitude: 30,
                minDistance: 0,
                maxDistance: 1000000,
              })
            }
            variant="outline"
            size="sm"
            className="w-full"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            重置筛选
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
