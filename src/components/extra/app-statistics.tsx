"use client";

import { useState, useMemo, memo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useStatistics,
  AppStats,
} from '@/stores/extra/app-statistics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  Area,
  AreaChart,
  TooltipProps,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  BarChart2,
  PieChart as PieChartIcon,
  TrendingUp,
  Calendar,
  Filter,
  Loader2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ChartData {
  name: string;
  launchCount: number;
  avgDuration: number;
}

interface PieChartData {
  name: string;
  totalDuration: number;
  percentage: string;
}

interface TimeRange {
  value: string;
  label: string;
}

interface ChartType {
  value: string;
  label: string;
  icon: React.ElementType;
}

const COLORS = {
  primary: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A'],
  dark: ['#61DAFB', '#4CAF50', '#FFC107', '#FF5722', '#9C27B0'],
};

const timeRanges: TimeRange[] = [
  { value: '7d', label: '近7天' },
  { value: '30d', label: '近30天' },
  { value: '90d', label: '近90天' },
  { value: 'all', label: '全部' },
];

const chartTypes: ChartType[] = [
  { value: 'bar', label: '柱状图', icon: BarChart2 },
  { value: 'pie', label: '饼图', icon: PieChartIcon },
  { value: 'line', label: '趋势图', icon: TrendingUp },
  { value: 'area', label: '面积图', icon: TrendingUp },
];

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: ChartData | PieChartData;
  }>;
  label?: string;
}

const ChartSkeleton = memo(() => (
  <div className="h-[400px] w-full flex items-center justify-center">
    <div className="text-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
      <p className="text-sm text-muted-foreground">加载图表数据...</p>
    </div>
  </div>
));

ChartSkeleton.displayName = "ChartSkeleton";

const CustomTooltip = memo(({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={cn(
          "bg-background/95 backdrop-blur-sm",
          "border border-border/50",
          "rounded-lg p-3 shadow-lg",
          "transition-all duration-200"
        )}
      >
        <p className="font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-muted-foreground">
            {entry.name === 'launchCount' && '使用次数: '}
            {entry.name === 'totalDuration' && '使用时长: '}
            {entry.name === 'avgDuration' && '平均时长: '}
            {entry.value}
            {entry.name.includes('Duration') && ' 分钟'}
          </p>
        ))}
      </motion.div>
    );
  }
  return null;
});

CustomTooltip.displayName = "CustomTooltip";

interface ChartContainerProps {
  children: React.ReactElement;
}

const ChartContainer = memo(({ children }: ChartContainerProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.2 }}
    className="h-[400px] pt-4"
  >
    <ResponsiveContainer width="100%" height="100%">
      {children}
    </ResponsiveContainer>
  </motion.div>
));

ChartContainer.displayName = "ChartContainer";

export const AppStatistics = memo(() => {
  const { getTopApps, getAppTrends } = useStatistics();
  const [activeTab, setActiveTab] = useState('usage');
  const [timeRange, setTimeRange] = useState('7d');
  const [chartType, setChartType] = useState('bar');
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const topApps = useMemo(() => {
    setIsLoading(true);
    const data = getTopApps(8);
    setIsLoading(false);
    return data;
  }, [getTopApps]);

  const trends = useMemo(() => getAppTrends(timeRange), [getAppTrends, timeRange]);

  const barData: ChartData[] = useMemo(() => 
    topApps.map((app: AppStats) => ({
      name: app.appId,
      launchCount: app.stats.launchCount,
      avgDuration: Math.round(app.stats.totalDuration / app.stats.launchCount / 60),
    })), 
    [topApps]
  );

  const pieData: PieChartData[] = useMemo(() => {
    const totalDuration = topApps.reduce((acc: number, curr: AppStats) => 
      acc + curr.stats.totalDuration, 0
    );
    
    return topApps.map((app: AppStats) => ({
      name: app.appId,
      totalDuration: Math.round(app.stats.totalDuration / 60),
      percentage: ((app.stats.totalDuration / totalDuration) * 100).toFixed(1),
    }));
  }, [topApps]);

  const renderChart = () => {
    if (activeTab === 'usage') {
      switch (chartType) {
        case 'bar':
          return (
            <BarChart
              data={barData}
              margin={{ top: 20, right: 30, bottom: 60, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Bar
                dataKey="launchCount"
                fill="var(--primary)"
                radius={[4, 4, 0, 0]}
              >
                {barData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={`var(--primary)`}
                    fillOpacity={0.8 - (index * 0.1)}
                  />
                ))}
              </Bar>
            </BarChart>
          );
        case 'pie':
          return (
            <PieChart>
              <Pie
                data={pieData}
                dataKey="totalDuration"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS.primary[index % COLORS.primary.length]}
                  />
                ))}
              </Pie>
              <Legend />
              <RechartsTooltip content={<CustomTooltip />} />
            </PieChart>
          );
        case 'line':
          return (
            <LineChart
              data={trends}
              margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <RechartsTooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={false}
                animationDuration={1000}
              />
            </LineChart>
          );
        default:
          return null;
      }
    }

    if (activeTab === 'duration') {
      return chartType === 'area' ? (
        <AreaChart
          data={trends}
          margin={{ top: 20, right: 30, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <RechartsTooltip content={<CustomTooltip />} />
          <defs>
            <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="duration"
            stroke="var(--primary)"
            fillOpacity={1}
            fill="url(#colorDuration)"
            animationDuration={1000}
          />
        </AreaChart>
      ) : (
        <PieChart>
          <Pie
            data={pieData}
            dataKey="totalDuration"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            animationDuration={800}
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS.primary[index % COLORS.primary.length]}
              />
            ))}
          </Pie>
          <Legend />
          <RechartsTooltip content={<CustomTooltip />} />
        </PieChart>
      );
    }

    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-primary" />
            应用使用统计
          </CardTitle>
          <CardDescription>查看应用使用情况和趋势分析</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className={cn(
              "w-[100px]",
              "transition-all duration-200",
              "hover:border-primary/50",
              "focus:ring-2 focus:ring-primary/20"
            )}>
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowDetails(!showDetails)}
            className={cn(
              "transition-all duration-200",
              "hover:border-primary/50",
              "hover:bg-primary/5"
            )}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 mb-4"
            >
              <div className="flex flex-wrap gap-2">
                {chartTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Button
                      key={type.value}
                      variant={chartType === type.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setChartType(type.value)}
                      className={cn(
                        "flex items-center gap-2",
                        "transition-all duration-200",
                        chartType !== type.value && "hover:border-primary/50 hover:bg-primary/5"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {type.label}
                    </Button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start">
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4" />
              使用统计
            </TabsTrigger>
            <TabsTrigger value="duration" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              使用时长
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              使用趋势
            </TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <ChartSkeleton />
            ) : (
              <>
                <TabsContent value="usage">
                  <ChartContainer>
                    {renderChart() || <div>暂无数据</div>}
                  </ChartContainer>
                </TabsContent>

                <TabsContent value="duration">
                  <ChartContainer>
                    {renderChart() || <div>暂无数据</div>}
                  </ChartContainer>
                </TabsContent>

                <TabsContent value="trends">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4"
                  >
                    {topApps.slice(0, 4).map((app: AppStats) => (
                      <Card 
                        key={app.appId} 
                        className={cn(
                          "p-4 transition-all duration-200",
                          "hover:border-primary/50",
                          "hover:shadow-lg"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium truncate">{app.appId}</h3>
                          <Badge 
                            variant="secondary"
                            className={cn(
                              "transition-colors duration-200",
                              app.stats.trend === 'up' 
                                ? "bg-green-500/10 text-green-500"
                                : "bg-red-500/10 text-red-500"
                            )}
                          >
                            {app.stats.trend === 'up' ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Badge>
                        </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-2xl font-bold">{app.stats.launchCount}</p>
                          <p className="text-xs text-muted-foreground">
                            较上周 {app.stats.trend === 'up' ? '增长' : '下降'}{' '}
                            {Math.abs(app.stats.weekChange)}%
                          </p>
                        </div>
                      </Card>
                    ))}
                  </motion.div>
                </TabsContent>
              </>
            )}
          </AnimatePresence>
        </Tabs>
      </CardContent>
    </Card>
  );
});

AppStatistics.displayName = "AppStatistics";