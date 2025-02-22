import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Star,
  Share2,
  Info,
  Settings as SettingsIcon,
  Eye,
  MapPin,
  Clock,
  Compass,
  Telescope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RiseSetChart } from "./riseset-chart";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import useSearchStore from "@/stores/skymap/searchStore";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CelestialObjectProps {
  id: string;
  name: string;
  type: string;
  constellation: string;
  rightAscension: string;
  declination: string;
  magnitude: number;
  size: number;
  distance: number;
  riseTime: string;
  setTime: string;
  transitTime: string;
  transitAltitude: number;
  thumbnail: string | null;
  isLoggedIn: boolean;
  className?: string;
  cardStyle?: "default" | "compact" | "detailed";
  showAdvancedInfo?: boolean;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  hover: {
    scale: 1.02,
    transition: { type: "spring", stiffness: 400, damping: 10 }
  }
};

const buttonVariants = {
  hover: {
    scale: 1.1,
    transition: { type: "spring", stiffness: 400, damping: 10 }
  }
};

export function CelestialObjectCard({
  id,
  className,
  showAdvancedInfo = false,
  ...props
}: CelestialObjectProps) {
  const { favorites, toggleFavorite } = useSearchStore();
  const isFavorite = favorites.includes(id);
  const [showDialog, setShowDialog] = useState(false);
  const [advancedInfoCollapsed, setAdvancedInfoCollapsed] = useState(true);

  const fullTitle = useMemo(() => {
    return `${props.name} (${props.constellation})`;
  }, [props.name, props.constellation]);

  const handleFavoriteClick = () => {
    toggleFavorite(id);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: fullTitle,
        text: `查看天体对象：${props.name}`,
        url: `/celestial-object/${id}`,
      });
    } catch {
      console.log("分享失败");
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className={cn("w-full", className)}
    >
      <Card className="bg-background/60 backdrop-blur-sm border-border/50 shadow-lg dark:shadow-none hover:shadow-xl transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex gap-4">
            {/* 缩略图 */}
            <div className="flex-none w-20 h-20">
              {props.thumbnail ? (
                <Image
                  src={props.thumbnail}
                  alt={props.name}
                  width={80}
                  height={80}
                  className="rounded-lg object-cover w-full h-full shadow-sm"
                />
              ) : (
                <div className="w-full h-full bg-muted/30 rounded-lg flex items-center justify-center shadow-inner">
                  <Star className="w-8 h-8 text-muted-foreground/50" />
                </div>
              )}
            </div>

            {/* 主要信息 */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link href={`/celestial-object/${id}`}>
                    <h3 className="text-lg font-medium hover:text-primary transition-colors">
                      {props.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {props.type}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {props.constellation}
                    </Badge>
                  </div>
                </div>
                <TooltipProvider>
                  <div className="flex flex-col gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div variants={buttonVariants} whileHover="hover">
                          <Button
                            size="sm"
                            variant={isFavorite ? "default" : "ghost"}
                            className="h-8 w-8 p-0"
                            onClick={handleFavoriteClick}
                          >
                            <Star className={cn("w-4 h-4", isFavorite && "fill-current")} />
                          </Button>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isFavorite ? "取消收藏" : "添加收藏"}</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.div variants={buttonVariants} whileHover="hover">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={handleShare}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>分享</p>
                      </TooltipContent>
                    </Tooltip>

                    <Dialog open={showDialog} onOpenChange={setShowDialog}>
                      <DialogTrigger asChild>
                        <motion.div variants={buttonVariants} whileHover="hover">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <Info className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-xl">{fullTitle}</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4 space-y-4">
                          <RiseSetChart
                            riseTime={props.riseTime}
                            setTime={props.setTime}
                            transitTime={props.transitTime}
                            transitAltitude={props.transitAltitude}
                            chartHeight={300}
                            showReferenceLines
                            enableZoom
                            animationDuration={1}
                          />
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">赤经</p>
                              <p className="font-medium">{props.rightAscension}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">赤纬</p>
                              <p className="font-medium">{props.declination}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">视星等</p>
                              <p className="font-medium">{props.magnitude}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">距离</p>
                              <p className="font-medium">{props.distance} 光年</p>
                            </div>
                          </div>
                        </div>
                        <DialogClose asChild>
                          <Button className="mt-4">关闭</Button>
                        </DialogClose>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TooltipProvider>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <div>
                  <span className="text-muted-foreground">赤经: </span>
                  <span className="font-medium">{props.rightAscension}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">赤纬: </span>
                  <span className="font-medium">{props.declination}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">视星等: </span>
                  <span className="font-medium">{props.magnitude}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">距离: </span>
                  <span className="font-medium">{props.distance} ly</span>
                </div>
              </div>
            </div>
          </div>

          {/* 可展开的高级信息区域 */}
          {showAdvancedInfo && (
            <AnimatePresence>
              <div className="mt-4 pt-4 border-t border-border/50">
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ 
                    height: advancedInfoCollapsed ? 0 : "auto",
                    opacity: advancedInfoCollapsed ? 0 : 1
                  }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { icon: Clock, label: "时间", action: "查看时间信息" },
                      { icon: MapPin, label: "位置", action: "定位" },
                      { icon: Compass, label: "方向", action: "查看方向" },
                      { icon: Eye, label: "预览", action: "预览天体" },
                      { icon: Telescope, label: "放大", action: "放大查看" },
                      { icon: SettingsIcon, label: "设置", action: "设置选项" },
                    ].map((item, index) => (
                      <TooltipProvider key={index}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full flex items-center gap-2"
                            >
                              <item.icon className="w-4 h-4" />
                              <span>{item.label}</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.action}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </motion.div>
                <div className="mt-4 flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setAdvancedInfoCollapsed(!advancedInfoCollapsed)}
                  >
                    {advancedInfoCollapsed ? "展开" : "收起"}
                  </Button>
                </div>
              </div>
            </AnimatePresence>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
