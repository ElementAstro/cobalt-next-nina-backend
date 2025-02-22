"use client";

import { useState, useMemo } from 'react';
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
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
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
      </div>
    );
  }
  return null;
};

export function AppStatistics() {
  const { getTopApps, getAppTrends } = useStatistics();
  const [activeTab, setActiveTab] = useState('usage');
  const [timeRange, setTimeRange] = useState('7d');
  const [chartType, setChartType] = useState('bar');
  const [showDetails, setShowDetails] = useState(false);

  const topApps = useMemo(() => getTopApps(8), [getTopApps]);
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
            <SelectTrigger className="w-[100px]">
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
                      className="flex items-center gap-2"
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

          <TabsContent value="usage" className="h-[400px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
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
                  />
                </BarChart>
              ) : chartType === 'pie' ? (
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
              ) : (
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
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="duration" className="h-[400px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
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
              )}
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {topApps.slice(0, 4).map((app: AppStats) => (
                <Card key={app.appId} className="p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium truncate">{app.appId}</h3>
                    <Badge variant="secondary">
                      {app.stats.trend === 'up' ? (
                        <ChevronUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-red-500" />
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
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}