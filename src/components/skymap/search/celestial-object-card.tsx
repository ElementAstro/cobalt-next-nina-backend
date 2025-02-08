import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Lightbulb,
  Maximize2,
  Move,
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
import { useState, useMemo, useEffect } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import useSearchStore from "@/stores/skymap/searchStore";

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
  animationType?: "fade" | "slide" | "zoom";
  showAdvancedInfo?: boolean;
}

export function CelestialObjectCard({
  id,
  className,
  animationType = "fade",
  showAdvancedInfo = false,
  ...props
}: CelestialObjectProps) {
  const { favorites, toggleFavorite } = useSearchStore();
  const isFavorite = favorites.includes(id);
  const controls = useAnimationControls();
  const { theme, setTheme } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  // 新增内部折叠状态，默认折叠
  const [advancedInfoCollapsed, setAdvancedInfoCollapsed] = useState(true);

  useEffect(() => {
    setIsDarkMode(theme === "dark");
  }, [theme]);

  const fullTitle = useMemo(() => {
    return `${props.name} (${props.constellation})`;
  }, [props.name, props.constellation]);

  const handleButtonHover = async (buttonType: string) => {
    await controls.start({
      scale: 1.05,
      transition: { type: "spring", stiffness: 300 },
    });
    switch (buttonType) {
      case "favorite":
        await controls.start({
          rotate: isFavorite ? [0, -10, 10, 0] : [0, 10, -10, 0],
          transition: { duration: 0.4 },
        });
        break;
      case "share":
        await controls.start({
          rotate: [0, 10, -10, 0],
          transition: { duration: 0.3 },
        });
        break;
      case "info":
        await controls.start({
          rotate: [0, 5, -5, 0],
          transition: { duration: 0.2 },
        });
        break;
      default:
        await controls.start({
          rotate: [0, 5, -5, 0],
          transition: { duration: 0.2 },
        });
    }
  };

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

  const toggleDarkMode = () => {
    const newMode = isDarkMode ? "light" : "dark";
    setTheme(newMode);
    setIsDarkMode(newMode === "dark");
  };

  // Dummy handlers for additional buttons
  const handleMaximize = () => {
    console.log("Maximize clicked");
  };
  const handleMove = () => {
    console.log("Move clicked");
  };
  const handleSettings = () => {
    console.log("Settings clicked");
  };
  const handlePreview = () => {
    console.log("Preview clicked");
  };
  const handleLocation = () => {
    console.log("Location clicked");
  };
  const handleTime = () => {
    console.log("Time clicked");
  };
  const handleDirection = () => {
    console.log("Direction clicked");
  };
  const handleZoom = () => {
    console.log("Zoom clicked");
  };

  return (
    <motion.div
      initial={
        animationType === "fade"
          ? { opacity: 0, y: 20 }
          : animationType === "slide"
          ? { x: -50, opacity: 0 }
          : { scale: 0.9, opacity: 0 }
      }
      animate={
        animationType === "fade"
          ? { opacity: 1, y: 0 }
          : animationType === "slide"
          ? { x: 0, opacity: 1 }
          : { scale: 1, opacity: 1 }
      }
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.02 }}
      className={cn("w-full", className)}
    >
      <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
        <CardContent className="p-2">
          <div className="flex gap-2">
            {/* 缩略图 */}
            <div className="flex-none w-14 h-14">
              {props.thumbnail ? (
                <Image
                  src={props.thumbnail}
                  alt={props.name}
                  width={56}
                  height={56}
                  className="rounded object-cover w-full h-full"
                />
              ) : (
                <div className="w-full h-full bg-muted rounded flex items-center justify-center">
                  <Star className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* 主要信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/celestial-object/${id}`}>
                  <h3 className="text-sm font-medium truncate hover:underline">
                    {props.name}
                  </h3>
                </Link>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {props.type}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1 text-xs">
                <div className="truncate">
                  <span className="text-muted-foreground">RA: </span>
                  {props.rightAscension}
                </div>
                <div className="truncate">
                  <span className="text-muted-foreground">Dec: </span>
                  {props.declination}
                </div>
                <div className="truncate">
                  <span className="text-muted-foreground">星座: </span>
                  {props.constellation}
                </div>
                <div className="truncate">
                  <span className="text-muted-foreground">星等: </span>
                  {props.magnitude}
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex-none flex flex-col gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onMouseEnter={() => handleButtonHover("favorite")}
                onClick={handleFavoriteClick}
              >
                <Star className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2"
                onMouseEnter={() => handleButtonHover("share")}
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onMouseEnter={() => handleButtonHover("info")}
                  >
                    <Info className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{fullTitle} - 详情</DialogTitle>
                  </DialogHeader>
                  {/* 显示上升、下降信息图 */}
                  <div className="mt-4">
                    <RiseSetChart
                      riseTime={props.riseTime}
                      setTime={props.setTime}
                      transitTime={props.transitTime}
                      transitAltitude={props.transitAltitude}
                      chartHeight={200}
                    />
                  </div>
                  <DialogClose>
                    <Button size="sm" variant="outline" className="mt-4">
                      关闭
                    </Button>
                  </DialogClose>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* 内部折叠切换按钮，仅当 showAdvancedInfo 为 true 时显示 */}
          {showAdvancedInfo && (
            <div className="mt-2 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setAdvancedInfoCollapsed((prevState) => !prevState)
                }
              >
                {advancedInfoCollapsed ? "展开" : "收起"}
              </Button>
            </div>
          )}

          {/* 扩展操作：包含所有额外的图标，折叠后隐藏 */}
          {showAdvancedInfo && !advancedInfoCollapsed && (
            <div className="mt-2 flex flex-wrap gap-2 justify-center">
              <Button
                size="sm"
                variant="outline"
                onMouseEnter={() => handleButtonHover("lightbulb")}
                onClick={toggleDarkMode}
                title="切换暗/亮模式"
              >
                <Lightbulb className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onMouseEnter={() => handleButtonHover("maximize")}
                onClick={handleMaximize}
                title="全屏预览"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onMouseEnter={() => handleButtonHover("move")}
                onClick={handleMove}
                title="移动卡片"
              >
                <Move className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onMouseEnter={() => handleButtonHover("settings")}
                onClick={handleSettings}
                title="设置"
              >
                <SettingsIcon className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onMouseEnter={() => handleButtonHover("eye")}
                onClick={handlePreview}
                title="预览"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onMouseEnter={() => handleButtonHover("mappin")}
                onClick={handleLocation}
                title="定位"
              >
                <MapPin className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onMouseEnter={() => handleButtonHover("clock")}
                onClick={handleTime}
                title="时间信息"
              >
                <Clock className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onMouseEnter={() => handleButtonHover("compass")}
                onClick={handleDirection}
                title="方向"
              >
                <Compass className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onMouseEnter={() => handleButtonHover("telescope")}
                onClick={handleZoom}
                title="放大"
              >
                <Telescope className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
