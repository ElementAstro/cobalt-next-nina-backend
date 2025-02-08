"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import ConnectionSettings from "@/components/remote/connection-settings";
import ControlPanel from "@/components/remote/control-panel";
import CustomOptions from "@/components/remote/custom-options";
import ConnectionLogs from "@/components/remote/connection-logs";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import ConnectingOverlay from "@/components/remote/connecting-overlay";
import { useMediaQuery } from "react-responsive";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Maximize2,
  Minimize2,
  Settings,
  MonitorSmartphone,
  LayoutGrid,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 定义 CustomOptions 需要的属性接口
interface CustomOptionsProps {
  keyboardShortcuts: boolean;
  handleKeyboardShortcuts: (checked: boolean) => void;
  theme: string;
  setTheme: (value: "light" | "dark") => void;
  scaleViewport: boolean;
  setScaleViewport: (checked: boolean) => void;
  clipViewport: boolean;
  setClipViewport: (checked: boolean) => void;
  dragViewport: boolean;
  setDragViewport: (checked: boolean) => void;
  resizeSession: boolean;
  setResizeSession: (checked: boolean) => void;
  showDotCursor: boolean;
  setShowDotCursor: (checked: boolean) => void;
  qualityLevel: number;
  setQualityLevel: (value: number) => void;
  compressionLevel: number;
  setCompressionLevel: (value: number) => void;
  background: string;
  setBackground: (value: string) => void;
  mobileMode?: boolean;
  touchScrolling: boolean;
  setTouchScrolling: (checked: boolean) => void;
  performanceMode: "quality" | "balanced" | "speed";
  setPerformanceMode: (value: "quality" | "balanced" | "speed") => void;
  inputMode: "touch" | "trackpad" | "mouse";
  setInputMode: (mode: "touch" | "trackpad" | "mouse") => void;
  gestureEnabled: boolean;
  setGestureEnabled: (enabled: boolean) => void;
  touchSensitivity: number;
  setTouchSensitivity: (value: number) => void;
  autoReconnect: boolean;
  setAutoReconnect: (enabled: boolean) => void;
  reconnectDelay: number;
  setReconnectDelay: (value: number) => void;
}

// 自定义 RFB 的实例类型
interface RFBClientInstance {
  disconnect: () => void;
  addEventListener: (
    event: string,
    handler: EventListenerOrEventListenerObject
  ) => void;
  removeEventListener: (
    event: string,
    handler: EventListenerOrEventListenerObject
  ) => void;
  viewOnly: boolean;
  scaleViewport: boolean;
  qualityLevel: number;
  compressionLevel: number;
  showDotCursor: boolean;
  background: string;
  resizeSession: boolean;
  defaultKeyboardHandlers?: unknown;
  keyboardHandlers?: unknown;
}

// 自定义 RFB 构造器类型
type RFBConstructor = {
  new (
    canvas: HTMLCanvasElement,
    url: string,
    options: {
      credentials?:
        | { username: string; password: string; target: string }
        | undefined;
      shared: boolean;
      wsProtocols: string[];
    }
  ): RFBClientInstance;
};

const NoVNCClient: React.FC = () => {
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [password, setPassword] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [clipboardSync, setClipboardSync] = useState(true);
  const [viewOnly, setViewOnly] = useState(false);
  const [colorDepth, setColorDepth] = useState<24 | 16 | 8>(24);
  const [connectionLogs, setConnectionLogs] = useState<
    { timestamp: Date; message: string }[]
  >([]);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // rfbRef 可能存放构造函数或实例
  const rfbRef = useRef<RFBConstructor | RFBClientInstance | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [connectionStage, setConnectionStage] = useState<
    "initializing" | "authenticating" | "establishing" | "connected"
  >("initializing");
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const isDesktop = useMediaQuery({ query: "(min-width: 768px)" });

  // 在 NoVNCClient 组件内添加新的响应式状态
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  // 更新 customOptionsProps 使其符合 CustomOptionsProps 接口要求
  const customOptionsProps: CustomOptionsProps = {
    theme,
    setTheme: (value: "light" | "dark") => setTheme(value),
    keyboardShortcuts: false,
    handleKeyboardShortcuts: (checked: boolean) =>
      console.log("Keyboard shortcuts toggled:", checked),
    scaleViewport: true,
    setScaleViewport: (checked: boolean) => {
      // 根据需求执行处理
      console.log("scaleViewport set to", checked);
    },
    clipViewport: false,
    setClipViewport: (checked: boolean) => {
      console.log("clipViewport set to", checked);
    },
    dragViewport: false,
    setDragViewport: (checked: boolean) => {
      console.log("dragViewport set to", checked);
    },
    resizeSession: true,
    setResizeSession: (checked: boolean) => {
      console.log("resizeSession set to", checked);
    },
    showDotCursor: true,
    setShowDotCursor: (checked: boolean) => {
      console.log("showDotCursor set to", checked);
    },
    qualityLevel: 6,
    setQualityLevel: (value: number) => {
      console.log("qualityLevel set to", value);
    },
    compressionLevel: 2,
    setCompressionLevel: (value: number) => {
      console.log("compressionLevel set to", value);
    },
    background: theme === "dark" ? "#000000" : "#ffffff",
    setBackground: (value: string) => {
      console.log("background set to", value);
    },
    touchScrolling: true,
    setTouchScrolling: (checked: boolean) => {
      console.log("touchScrolling set to", checked);
    },
    performanceMode: "balanced",
    setPerformanceMode: (value: "quality" | "balanced" | "speed") => {
      console.log("performanceMode set to", value);
    },
    inputMode: "mouse",
    setInputMode: (mode: "touch" | "trackpad" | "mouse") => {
      console.log("inputMode set to", mode);
    },
    gestureEnabled: false,
    setGestureEnabled: (enabled: boolean) => {
      console.log("gestureEnabled set to", enabled);
    },
    touchSensitivity: 50,
    setTouchSensitivity: (value: number) => {
      console.log("touchSensitivity set to", value);
    },
    autoReconnect: false,
    setAutoReconnect: (enabled: boolean) => {
      console.log("autoReconnect set to", enabled);
    },
    reconnectDelay: 5,
    setReconnectDelay: (value: number) => {
      console.log("reconnectDelay set to", value);
    },
  };

  // 动态加载 RFB
  useEffect(() => {
    const loadRFB = async () => {
      if (typeof window !== "undefined") {
        const RFBImport = await import("@novnc/novnc/lib/rfb");
        // 强制转换为 RFBConstructor 类型
        const RFB = RFBImport.default as unknown as RFBConstructor;
        rfbRef.current = RFB;
      }
    };
    loadRFB();
  }, []);

  const logEvent = useCallback((message: string) => {
    setConnectionLogs((prevLogs) => [
      ...prevLogs,
      { timestamp: new Date(), message },
    ]);
  }, []);

  const connectToVNC = useCallback(async () => {
    if (!host || !port) {
      setError("请同时输入主机和端口");
      return;
    }

    setError(null);
    setConnectionProgress(0);
    setConnectionStage("initializing");

    // 模拟连接进度
    const progressInterval = setInterval(() => {
      setConnectionProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 50);

    // 模拟连接阶段
    setTimeout(() => setConnectionStage("authenticating"), 1500);
    setTimeout(() => setConnectionStage("establishing"), 3000);
    setTimeout(() => setConnectionStage("connected"), 4500);

    logEvent(`尝试连接到 ${host}:${port}`);

    const url = `wss://${host}:${port}`;

    if (canvasRef.current && rfbRef.current) {
      try {
        // rfbRef.current 最初为构造函数，此处断言为 RFBConstructor
        const RFB = rfbRef.current as RFBConstructor;
        const rfb = new RFB(canvasRef.current, url, {
          credentials: password
            ? { username: "", password, target: "" }
            : undefined,
          shared: true,
          wsProtocols: [],
        });

        rfb.viewOnly = viewOnly;
        rfb.scaleViewport = true;
        rfb.qualityLevel = 6;
        rfb.compressionLevel = 2;
        rfb.showDotCursor = true;
        rfb.background = theme === "dark" ? "#000000" : "#ffffff";

        rfb.addEventListener("connect", () => {
          setIsConnected(true);
          setError(null);
          logEvent("成功连接到 VNC 服务器");
        });

        rfb.addEventListener("disconnect", () => {
          setIsConnected(false);
          setError("与 VNC 服务器断开连接");
          logEvent("与 VNC 服务器断开连接");
        });

        rfb.addEventListener("credentialsrequired", () => {
          setError("需要 VNC 认证");
          logEvent("VNC 认证请求");
        });

        if (clipboardSync) {
          rfb.addEventListener("clipboard", (evt: Event) => {
            const e = evt as CustomEvent;
            navigator.clipboard.writeText(e.detail.text);
            logEvent("剪贴板同步数据接收");
          });
        }

        rfb.scaleViewport = true;
        rfb.resizeSession = true;

        rfbRef.current = rfb;
        logEvent("VNC 连接已初始化");
      } catch {
        setError("连接到 VNC 服务器失败");
        logEvent("连接 VNC 服务器时发生错误");
      }
    }

    clearInterval(progressInterval);
    setConnectionProgress(100);
  }, [host, port, password, viewOnly, clipboardSync, theme, logEvent]);

  const disconnectFromVNC = useCallback(() => {
    if (rfbRef.current && "disconnect" in rfbRef.current) {
      rfbRef.current.disconnect();
      rfbRef.current = null;
      logEvent("手动断开 VNC 连接");
    }
    setIsConnected(false);
  }, [logEvent]);

  const handleScaleChange = useCallback(
    (value: number[]) => {
      setScale(value[0]);
      if (
        rfbRef.current &&
        canvasRef.current &&
        "scaleViewport" in rfbRef.current
      ) {
        rfbRef.current.scaleViewport = true;
        canvasRef.current.style.transform = `scale(${value[0] / 100})`;
        canvasRef.current.style.transformOrigin = "top left";
        logEvent(`缩放比例调整为 ${value[0]}%`);
      }
    },
    [logEvent]
  );

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen();
      logEvent("进入全屏模式");
    } else {
      document.exitFullscreen();
      logEvent("退出全屏模式");
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen, logEvent]);

  const handleClipboardSync = useCallback(
    (checked: boolean) => {
      setClipboardSync(checked);
      if (rfbRef.current && "addEventListener" in rfbRef.current) {
        if (checked) {
          rfbRef.current.addEventListener("clipboard", (evt: Event) => {
            const e = evt as CustomEvent;
            navigator.clipboard.writeText(e.detail.text);
            logEvent("启用剪贴板同步");
          });
        } else {
          // 无法精确移除指定回调时，可使用空函数作为占位符
          rfbRef.current.removeEventListener("clipboard", () => {});
          logEvent("禁用剪贴板同步");
        }
      }
    },
    [logEvent]
  );

  const handleViewOnlyChange = useCallback(
    (checked: boolean) => {
      setViewOnly(checked);
      if (rfbRef.current && "viewOnly" in rfbRef.current) {
        rfbRef.current.viewOnly = checked;
        logEvent(`设置视图模式为 ${checked ? "仅查看" : "可交互"}`);
      }
    },
    [logEvent]
  );

  const handleColorDepthChange = useCallback(
    (value: string) => {
      const depth = parseInt(value) as 24 | 16 | 8;
      setColorDepth(depth);
      if (rfbRef.current && "qualityLevel" in rfbRef.current) {
        switch (depth) {
          case 24:
            rfbRef.current.qualityLevel = 8;
            rfbRef.current.compressionLevel = 2;
            break;
          case 16:
            rfbRef.current.qualityLevel = 5;
            rfbRef.current.compressionLevel = 3;
            break;
          case 8:
            rfbRef.current.qualityLevel = 3;
            rfbRef.current.compressionLevel = 4;
            break;
        }
        logEvent(`颜色深度设置为 ${depth}-bit`);
      }
    },
    [logEvent]
  );

  // 全屏变化监听
  useEffect(() => {
    const handleFullscreenChange = () => {
      const full = !!document.fullscreenElement;
      setIsFullscreen(full);
      logEvent(`全屏状态变化: ${full}`);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      if (rfbRef.current && "disconnect" in rfbRef.current) {
        rfbRef.current.disconnect();
      }
    };
  }, [logEvent]);

  // 修改 return 部分的布局结构
  return (
    <div
      className={cn(
        "h-screen flex flex-col",
        theme === "dark" ? "dark" : "light"
      )}
    >
      {error && (
        <div className="bg-red-500 text-white p-2 text-center">{error}</div>
      )}

      <header className="h-12 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-none">
        <div className="flex h-full items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            {isConnected && (
              <span className="text-sm text-muted-foreground">
                已连接到 {host}:{port}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
              className="hidden sm:flex"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            <Sheet open={showSidebar} onOpenChange={setShowSidebar}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side={isDesktop ? "right" : "bottom"}
                className="w-[400px] sm:w-[540px]"
              >
                <SheetHeader>
                  <SheetTitle>远程控制设置</SheetTitle>
                </SheetHeader>
                <Tabs defaultValue="connection" className="mt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="connection">连接</TabsTrigger>
                    <TabsTrigger value="control">控制</TabsTrigger>
                    <TabsTrigger value="advanced">高级</TabsTrigger>
                  </TabsList>
                  <TabsContent value="connection">
                    <ScrollArea className="h-[80vh] pr-4">
                      <ConnectionSettings
                        host={host}
                        port={port}
                        password={password}
                        isConnected={isConnected}
                        setHost={setHost}
                        setPort={setPort}
                        setPassword={setPassword}
                      />
                      <div className="mt-4">
                        <ConnectionLogs logs={connectionLogs} />
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="control">
                    <ScrollArea className="h-[80vh] pr-4">
                      <ControlPanel
                        isConnected={isConnected}
                        toggleFullscreen={toggleFullscreen}
                        connectToVNC={connectToVNC}
                        disconnectFromVNC={disconnectFromVNC}
                        clipboardSync={clipboardSync}
                        handleClipboardSync={handleClipboardSync}
                        viewOnly={viewOnly}
                        handleViewOnlyChange={handleViewOnlyChange}
                        colorDepth={colorDepth.toString()}
                        handleColorDepthChange={handleColorDepthChange}
                        hasPowerCapability={true}
                        onShutdown={() => logEvent("Shutdown initiated")}
                        onReboot={() => logEvent("Reboot initiated")}
                        onReset={() => logEvent("Reset initiated")}
                        orientation="vertical"
                        enableAnimation={true}
                        showPerformanceStats={true}
                        onTogglePerformanceStats={(checked) =>
                          logEvent(
                            `Performance stats ${
                              checked ? "enabled" : "disabled"
                            }`
                          )
                        }
                        customKeys={[
                          {
                            label: "Ctrl+Alt+Del",
                            keys: ["Ctrl", "Alt", "Del"],
                          },
                        ]}
                        onSendCustomKeys={(keys) =>
                          logEvent(`Custom keys sent: ${keys.join("+")}`)
                        }
                        layout="full"
                        latency={50}
                        frameRate={60}
                        bandwidth={1024 * 1024 * 10}
                        connectionQuality="good"
                      />
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="advanced">
                    <ScrollArea className="h-[80vh] pr-4">
                      <CustomOptions {...customOptionsProps} />
                      <Card className="mt-4">
                        <CardHeader>
                          <CardTitle>显示设置</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span>缩放比例</span>
                                <span>{scale}%</span>
                              </div>
                              <Slider
                                value={[scale]}
                                onValueChange={handleScaleChange}
                                min={25}
                                max={200}
                                step={25}
                                className="w-full"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden">
        <ConnectingOverlay
          isConnecting={connectionStage !== "connected" && isConnected}
          connectionStage={connectionStage}
          progress={connectionProgress}
        />

        <ResizablePanelGroup
          direction={isMobile ? "vertical" : "horizontal"}
          className="min-h-0 h-full"
        >
          <ResizablePanel
            defaultSize={isMobile ? 75 : 80}
            minSize={isMobile ? 40 : 30}
            className={cn(
              "transition-all duration-200 ease-in-out",
              "flex flex-col min-h-0"
            )}
          >
            <div
              ref={containerRef}
              className={cn(
                "relative flex-1 min-h-0",
                "flex items-center justify-center",
                "bg-black/90 overflow-hidden"
              )}
            >
              <canvas
                ref={canvasRef}
                className={cn(
                  "transition-transform duration-200",
                  "max-h-full max-w-full",
                  "object-contain"
                )}
              />
              <AnimatePresence>
                {!isConnected && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur"
                  >
                    <Card className="w-[90%] max-w-md">
                      <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                          <MonitorSmartphone className="w-12 h-12 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            请连接到远程设备以开始控制
                          </p>
                          <Button
                            className="w-full"
                            onClick={connectToVNC}
                            disabled={!host || !port}
                          >
                            连接设备
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </ResizablePanel>

          <ResizableHandle
            className="bg-border/50 hover:bg-border"
            withHandle
          />

          <ResizablePanel
            defaultSize={isMobile ? 25 : 20}
            minSize={15}
            className={cn(
              "bg-background/95 backdrop-blur",
              "flex flex-col min-h-0"
            )}
          >
            <ScrollArea className="flex-1 w-full">
              <div className="p-2 space-y-2">
                <ConnectionLogs
                  logs={connectionLogs}
                  defaultHeight={isMobile ? "h-[30vh]" : "h-[60vh]"}
                />
              </div>
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>

        <Sheet
          open={showSidebar}
          onOpenChange={setShowSidebar}
          modal={isMobile}
        >
          <SheetContent
            side={isMobile ? "bottom" : "right"}
            className={cn(
              "w-[90vw] sm:w-[440px] md:w-[540px]",
              "p-0",
              isMobile && "h-[85vh] rounded-t-xl"
            )}
          >
            <div className="h-full flex flex-col">
              <SheetHeader className="p-4 pb-2 flex-none">
                <SheetTitle>远程控制设置</SheetTitle>
              </SheetHeader>
              <Tabs defaultValue="connection" className="flex-1">
                <TabsList className="px-4 grid w-full grid-cols-3 h-10">
                  <TabsTrigger value="connection">连接</TabsTrigger>
                  <TabsTrigger value="control">控制</TabsTrigger>
                  <TabsTrigger value="advanced">高级</TabsTrigger>
                </TabsList>
                <div className="flex-1 overflow-hidden">
                  <TabsContent value="connection" className="h-full m-0">
                    <ScrollArea className="h-[calc(85vh-6rem)] sm:h-[80vh] px-4">
                      <div className="space-y-4 pb-8">
                        <ConnectionSettings
                          host={host}
                          port={port}
                          password={password}
                          isConnected={isConnected}
                          setHost={setHost}
                          setPort={setPort}
                          setPassword={setPassword}
                        />
                        <ConnectionLogs logs={connectionLogs} />
                      </div>
                    </ScrollArea>
                  </TabsContent>
                  {/* ... other tabs content ... */}
                </div>
              </Tabs>
            </div>
          </SheetContent>
        </Sheet>
      </main>
    </div>
  );
};

export default NoVNCClient;
