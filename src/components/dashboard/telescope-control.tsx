"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Minus,
  Maximize2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Square,
  Play,
  RotateCcw,
  ParkingSquare,
  AlertCircle,
} from "lucide-react";
import { useTelescopeStore } from "@/stores/telescopeStore";
import { toast } from "@/hooks/use-toast";

export default function TelescopeControl() {
  // 状态管理
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isIconMode, setIsIconMode] = useState(false);
  const [coordSystem, setCoordSystem] = useState<"RA" | "Alt">("RA");
  const [moveSpeed, setMoveSpeed] = useState<string>("3");

  const constraintsRef = useRef(null);

  // Store状态和方法
  const {
    telescopeInfo,
    isConnected,
    isLoading,
    error,
    park,
    findHome,
    setTracking,
  } = useTelescopeStore();

  // 错误处理
  useEffect(() => {
    if (error) {
      toast({
        title: "望远镜控制错误",
        description: error,
        variant: "destructive",
      });
    }
  }, [error]);

  // UI控制函数
  const toggleMinimize = () => setIsMinimized(!isMinimized);
  const toggleMode = () => setIsIconMode(!isIconMode);

  // 望远镜控制函数
  const handleDirectionControl = async (direction: string) => {
    // TODO: 实现方向控制逻辑
    console.log(`Moving telescope: ${direction}, speed: ${moveSpeed}`);
  };

  const handleTracking = async () => {
    try {
      await setTracking(!telescopeInfo?.IsTracking);
    } catch (error) {
      console.error("跟踪控制失败:", error);
    }
  };

  const handlePark = async () => {
    try {
      await park();
    } catch (error) {
      console.error("停靠失败:", error);
    }
  };

  const handleFindHome = async () => {
    try {
      await findHome();
    } catch (error) {
      console.error("寻找原点失败:", error);
    }
  };

  // 样式定义
  const buttonClass = `w-full ${
    isConnected
      ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
      : "bg-gray-600 cursor-not-allowed"
  } text-white`;

  // 按钮渲染函数
  const renderButton = (
    text: string | React.ReactNode,
    icon: React.ReactNode,
    onClick: () => void,
    className = ""
  ) => (
    <Button
      variant="ghost"
      className={`${buttonClass} ${className}`}
      onClick={onClick}
      disabled={!isConnected || isLoading}
    >
      {isIconMode ? icon : text}
    </Button>
  );

  // 渲染状态信息
  const renderStatus = () => {
    if (!isConnected) {
      return (
        <div className="flex items-center text-yellow-500 gap-2">
          <AlertCircle size={16} />
          <span>未连接</span>
        </div>
      );
    }

    return coordSystem === "RA" ? (
      <>
        <div>RA: {telescopeInfo?.RightAscension || "0h 0m"}</div>
        <div>Dec: {telescopeInfo?.Declination || "0° 0′"}</div>
      </>
    ) : (
      <>
        <div>Alt: {telescopeInfo?.Altitude || "0°"}</div>
        <div>Az: {telescopeInfo?.Azimuth || "0°"}</div>
      </>
    );
  };

  return (
    <div ref={constraintsRef} className="fixed inset-0 pointer-events-none">
      <motion.div
        drag
        dragMomentum={false}
        initial={{ x: 0, y: 0 }}
        animate={position}
        onDragEnd={(_, info) => {
          const newPosition = {
            x: position.x + info.offset.x,
            y: position.y + info.offset.y,
          };
          setPosition(newPosition);
        }}
        className="absolute pointer-events-auto"
        style={{
          touchAction: "none",
          width: isMinimized ? "300px" : "300px",
          left: "50%",
          top: "50%",
          x: "-50%",
          y: "-50%",
        }}
      >
        <Card className="bg-[#1a1a1a] overflow-hidden">
          {/* Header */}
          <div className="bg-[#2a2a2a] p-2 cursor-move flex items-center justify-between text-white">
            <span className="text-sm font-medium">
              望远镜控制 {isLoading && "(处理中...)"}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="mode-toggle"
                  checked={isIconMode}
                  onCheckedChange={toggleMode}
                />
                <Label htmlFor="mode-toggle" className="text-xs">
                  {isIconMode ? "Icon" : "Text"}
                </Label>
              </div>
              <button
                onClick={toggleMinimize}
                className="p-1 hover:bg-[#3a3a3a] rounded"
              >
                {isMinimized ? <Maximize2 size={14} /> : <Minus size={14} />}
              </button>
            </div>
          </div>

          <motion.div
            animate={{
              height: isMinimized ? 0 : "auto",
              opacity: isMinimized ? 0 : 1,
            }}
            transition={{ duration: 0.2 }}
            className="origin-top"
          >
            <div className="p-4 space-y-4">
              {/* Speed Control */}
              <div className="flex items-center justify-end text-white mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">速率</span>
                  <Select value={moveSpeed} onValueChange={setMoveSpeed}>
                    <SelectTrigger className="w-[60px] bg-transparent border-gray-600 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map((speed) => (
                        <SelectItem key={speed} value={speed.toString()}>
                          {speed}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Direction Controls */}
              <div className="relative grid grid-cols-3 gap-2 aspect-square">
                {/* 中上 - 北 */}
                <div className="col-start-2">
                  {renderButton(
                    "北",
                    <ArrowUp size={24} />,
                    () => handleDirectionControl("N"),
                    "h-full text-lg"
                  )}
                </div>

                {/* 左中 - 西 */}
                <div className="row-start-2">
                  {renderButton(
                    "西",
                    <ArrowLeft size={24} />,
                    () => handleDirectionControl("W"),
                    "h-full text-lg"
                  )}
                </div>

                {/* 中心 - 停止 */}
                <div className="row-start-2 col-start-2">
                  {renderButton(
                    "停止",
                    <Square size={24} />,
                    () => handleDirectionControl("STOP"),
                    "h-full text-lg bg-red-600 hover:bg-red-700"
                  )}
                </div>

                {/* 右中 - 东 */}
                <div className="row-start-2 col-start-3">
                  {renderButton(
                    "东",
                    <ArrowRight size={24} />,
                    () => handleDirectionControl("E"),
                    "h-full text-lg"
                  )}
                </div>

                {/* 中下 - 南 */}
                <div className="row-start-3 col-start-2">
                  {renderButton(
                    "南",
                    <ArrowDown size={24} />,
                    () => handleDirectionControl("S"),
                    "h-full text-lg"
                  )}
                </div>

                {/* 右下 - 跟踪控制 */}
                <div className="row-start-3 col-start-3">
                  {renderButton(
                    telescopeInfo?.IsTracking ? "停止跟踪" : "开始跟踪",
                    telescopeInfo?.IsTracking ? (
                      <Square size={24} />
                    ) : (
                      <Play size={24} />
                    ),
                    handleTracking,
                    "h-full text-sm"
                  )}
                </div>
              </div>

              {/* 添加速度指示器 */}
              <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                速度: {moveSpeed}x
              </div>

              {/* Bottom Controls */}
              <div className="grid grid-cols-2 gap-2">
                {renderButton(
                  "回零位",
                  <RotateCcw size={20} />,
                  handleFindHome,
                  "h-14"
                )}
                {renderButton(
                  "停放",
                  <ParkingSquare size={20} />,
                  handlePark,
                  "h-14"
                )}
              </div>

              {/* Status Display */}
              <div className="flex justify-between text-white text-sm mt-2">
                <div className="flex items-center gap-2">
                  <Select
                    value={coordSystem}
                    onValueChange={(val: "RA" | "Alt") => setCoordSystem(val)}
                  >
                    <SelectTrigger className="w-[80px] bg-transparent border-gray-600 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RA">RA/Dec</SelectItem>
                      <SelectItem value="Alt">Alt/Az</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-x-4">{renderStatus()}</div>
                <div className="text-right">
                  {telescopeInfo?.SideOfPier === 0 ? "东跨" : "西跨"}
                </div>
              </div>
            </div>
          </motion.div>
        </Card>
      </motion.div>
    </div>
  );
}
