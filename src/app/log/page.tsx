"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LogFilters from "@/components/log/log-filters";
import LogActions from "@/components/log/log-actions";
import LogTabs from "@/components/log/log-tabs";

const LogPanel: React.FC = () => {
  return (
    <Card className="dark h-screen flex flex-col">
      {" "}
      {/* 使用 h-screen 确保占据整个屏幕高度 */}
      <CardHeader className="px-3 py-2 border-b flex-none">
        <CardTitle className="text-base font-medium">日志面板</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
        <div className="p-2 space-y-1 border-b bg-muted/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 auto-rows-fr">
            {" "}
            {/* 使用 grid-cols 和 auto-rows 实现自适应 */}
            <LogFilters />
            <LogActions />
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <LogTabs />
        </div>
      </CardContent>
    </Card>
  );
};

export default LogPanel;
