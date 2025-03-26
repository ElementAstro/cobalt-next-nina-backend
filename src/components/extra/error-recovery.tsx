import { Info, AlertTriangle, WifiOff, DatabaseZap, Server, RefreshCw } from "lucide-react";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export type ErrorType = 
  | "network"
  | "timeout"
  | "server"
  | "database"
  | "permission"
  | "unknown";

interface ErrorInfo {
  type: ErrorType;
  title: string;
  description: string;
  steps: string[];
  icon: React.ComponentType<{ className?: string }>;
  severity: "default" | "destructive";
}

const errorMap = new Map<ErrorType, ErrorInfo>([
  ["network", {
    type: "network",
    title: "网络连接错误",
    description: "无法连接到服务器，这可能是由于网络问题或服务器无响应导致",
    steps: [
      "检查您的网络连接是否正常",
      "确认其他网站是否可以访问",
      "尝试刷新页面或重新连接",
      "如果使用VPN，请检查VPN连接状态"
    ],
    icon: WifiOff,
    severity: "destructive"
  }],
  ["timeout", {
    type: "timeout",
    title: "请求超时",
    description: "服务器响应时间过长，可能是网络延迟或服务器负载过高",
    steps: [
      "等待几分钟后重试",
      "检查网络连接速度",
      "关闭并重新打开应用",
      "如果问题持续，请联系技术支持"
    ],
    icon: Server,
    severity: "destructive"
  }],
  ["server", {
    type: "server",
    title: "服务器错误",
    description: "服务器处理请求时发生错误，这可能是暂时性的问题",
    steps: [
      "等待几分钟后重试",
      "清除浏览器缓存",
      "检查服务器状态页面",
      "如果问题持续，请报告此问题"
    ],
    icon: AlertTriangle,
    severity: "destructive"
  }],
  ["database", {
    type: "database",
    title: "数据库错误",
    description: "访问数据时发生错误，这可能是数据库连接或查询问题",
    steps: [
      "检查数据库连接状态",
      "验证数据访问权限",
      "重新加载应用",
      "如果问题持续，请联系管理员"
    ],
    icon: DatabaseZap,
    severity: "destructive"
  }],
  ["permission", {
    type: "permission",
    title: "权限错误",
    description: "没有足够的权限执行此操作",
    steps: [
      "检查您的账户权限",
      "尝试重新登录",
      "确认是否需要额外授权",
      "联系管理员获取帮助"
    ],
    icon: Info,
    severity: "default"
  }],
  ["unknown", {
    type: "unknown",
    title: "未知错误",
    description: "发生了未知错误，这可能是临时性问题",
    steps: [
      "刷新页面重试",
      "清除浏览器缓存",
      "检查控制台错误日志",
      "如果问题持续，请联系技术支持"
    ],
    icon: AlertTriangle,
    severity: "destructive"
  }]
]);

export const getErrorInfo = (type: ErrorType): ErrorInfo => {
  return errorMap.get(type) || errorMap.get("unknown")!;
};

export const ErrorRecovery = ({
  type,
  className,
}: {
  type: ErrorType;
  className?: string;
}) => {
  const errorInfo = getErrorInfo(type);
  const Icon = errorInfo.icon;

  return (
    <Alert 
      variant={errorInfo.severity}
      className={cn(
        "animate-in fade-in-50 duration-300",
        className
      )}
    >
      <Icon className="h-4 w-4" />
      <AlertTitle className="flex items-center gap-2">
        {errorInfo.title}
        <span className="text-xs text-muted-foreground">
          #{type}
        </span>
      </AlertTitle>
      <AlertDescription>
        <p className="mt-2 text-sm text-muted-foreground">
          {errorInfo.description}
        </p>
        <div className="mt-4 space-y-3">
          <h4 className="text-sm font-medium">建议解决步骤:</h4>
          <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
            {errorInfo.steps.map((step, index) => (
              <li key={index} className="animate-in fade-in-50 duration-300" style={{
                animationDelay: `${index * 100}ms`
              }}>
                {step}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-4">
            如果按照以上步骤操作后问题仍然存在，请
            <button 
              className="text-primary hover:underline focus:outline-none focus:underline mx-1"
              onClick={() => {
                window.location.reload();
              }}
            >
              <RefreshCw className="h-3 w-3 inline mr-1" />
              刷新页面
            </button>
            重试或联系技术支持。
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};