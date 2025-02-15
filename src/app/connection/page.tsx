"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Database, Plug, Settings, Wifi } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import { useConnectionStore } from "@/stores/connection";
import { useConnectionConfigStore } from "@/stores/connection/configStore";
import { useConnectionStatusStore } from "@/stores/connection/statusStore";

// 导入实现的组件
import { NetworkStatus } from "@/components/connection/network-status";
import { ConnectionDetails } from "@/components/connection/connection-details";
import { LoginForm } from "@/components/connection/login-form";
import { ConfigurationManager } from "@/components/connection/configuration-manager";
import ServerPortScanModal from "@/components/connection/server-port-scan";
import ConnectionHistory from "@/components/connection/connection-history";

// 类型定义
export interface ConnectionFormData {
  ip: string;
  port: number;
  username: string;
  password: string;
  isSSL: boolean;
  rememberLogin: boolean;
}

const formSchema = z.object({
  ip: z.string().min(1, "IP/Hostname is required").max(255),
  port: z.number().int().min(1).max(65535),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  isSSL: z.boolean(),
  rememberLogin: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ConnectionPage() {
  const isMobile = useIsMobile();

  // 状态管理
  const [showPassword, setShowPassword] = useState(false);
  const [showPortScan, setShowPortScan] = useState(false);
  const [showConfigManager, setShowConfigManager] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<"connect" | "config">("connect");

  // Stores
  const { connect, disconnect } = useConnectionStore();
  const { formData, updateFormData, loadFromCookies, saveToCookies } =
    useConnectionConfigStore();
  const { isConnected, isLoading, connectionStrength, addConnectionHistory } =
    useConnectionStatusStore();

  // Form initialization
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...formData,
      isSSL: formData.isSSL ?? false,
      rememberLogin: formData.rememberLogin ?? false,
    },
  });

  useEffect(() => {
    loadFromCookies();
  }, [loadFromCookies]);

  const handleConnect = async (values: FormValues) => {
    try {
      // 更新表单数据到 store
      updateFormData(values);
      await connect();
      // 如果选择记住登录，保存到 cookies
      if (values.rememberLogin) {
        saveToCookies();
      }
      addConnectionHistory(`${values.ip}:${values.port}`);
      toast({
        title: "连接成功",
        description: "已成功连接到服务器",
      });
    } catch (error) {
      toast({
        title: "连接失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive",
      });
    }
  };

  // 修改配置导入处理函数
  const handleConfigImport = (config: Partial<typeof formData>) => {
    updateFormData(config);
    form.reset({ ...formData, ...config });
  };

  // 渲染主内容
  const renderContent = () => (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {/* 连接控制面板 */}
        <Card className="w-full">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plug className="w-5 h-5" />
              连接控制面板
              {isConnected && (
                <Badge variant="default" className="ml-auto">
                  <Wifi className="w-4 h-4 mr-1" />
                  {connectionStrength}%
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleConnect)}
                className="space-y-4"
              >
                <div className="space-y-4">
                  <ConnectionDetails
                    form={form}
                    isSSL={formData.isSSL}
                    setIsSSL={(val) => updateFormData({ isSSL: val })}
                  />
                  <LoginForm
                    form={form}
                    showPassword={showPassword}
                    togglePasswordVisibility={() =>
                      setShowPassword(!showPassword)
                    }
                  />
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Switch
                      id="remember"
                      checked={formData.rememberLogin}
                      onCheckedChange={(checked) =>
                        updateFormData({ rememberLogin: checked })
                      }
                    />
                    <Label htmlFor="remember">记住登录</Label>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPortScan(true)}
                    className="w-full sm:w-auto"
                  >
                    端口扫描
                  </Button>
                </div>
                <div className="pt-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isConnected || isLoading}
                  >
                    {isLoading ? "连接中..." : "连接"}
                  </Button>
                </div>
              </form>
            </Form>
            {isConnected && (
              <Button
                variant="destructive"
                onClick={disconnect}
                className="mt-4 w-full"
              >
                断开连接
              </Button>
            )}
          </CardContent>
        </Card>

        {/* 配置管理面板 */}
        <Card className="w-full">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="w-5 h-5" />
              配置管理
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => setShowConfigManager(true)}
                className="w-full"
              >
                <Settings className="w-4 h-4 mr-2" />
                配置管理器
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowHistory(true)}
                className="w-full"
              >
                <Database className="w-4 h-4 mr-2" />
                连接历史
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <NetworkStatus status={{ online: navigator.onLine }} />
      {isMobile ? (
        <div className="flex flex-col h-full">
          <div className="flex border-b bg-card">
            <button
              className={`flex-1 p-4 text-sm font-medium transition-colors ${
                activeTab === "connect"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground"
              }`}
              onClick={() => setActiveTab("connect")}
            >
              连接
            </button>
            <button
              className={`flex-1 p-4 text-sm font-medium transition-colors ${
                activeTab === "config"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground"
              }`}
              onClick={() => setActiveTab("config")}
            >
              配置
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            {activeTab === "connect" ? renderContent() : null}
          </div>
        </div>
      ) : (
        renderContent()
      )}

      {/* 模态框组件 */}
      <ServerPortScanModal
        isOpen={showPortScan}
        onClose={() => setShowPortScan(false)}
      />
      <ConfigurationManager
        isOpen={showConfigManager}
        onClose={() => setShowConfigManager(false)}
        onImport={handleConfigImport}
      />
      <ConnectionHistory
        isVisible={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}
