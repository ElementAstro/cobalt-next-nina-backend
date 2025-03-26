"use client";

import React, {
  Component,
  ErrorInfo,
  ReactNode,
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  // 移除未使用的图标导入
} from "lucide-react";
import BlueScreen404 from "./blue-screen-404";
// 导入共享错误组件
import { ErrorHeader, ErrorDetails, ErrorActions } from "./error-shared";

interface ErrorBoundaryContextType {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
}

const ErrorBoundaryContext = createContext<ErrorBoundaryContextType>({
  error: null,
  errorInfo: null,
  resetError: () => {},
});

export const useErrorBoundary = () => useContext(ErrorBoundaryContext);

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: unknown[];
  customClassName?: string;
  showErrorDetails?: boolean;
  theme?: "light" | "dark";
  reportError?: (error: Error, errorInfo: ErrorInfo) => Promise<void>;
  maxRetries?: number;
  customLogger?: (error: Error, errorInfo: ErrorInfo) => void;
  language?: "en" | "zh";
  getSuggestion?: (error: Error) => string;
  useBlueScreen?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  isReporting: boolean;
  retryCount: number;
  errorTime?: Date;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isReporting: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorTime: new Date(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    if (this.props.customLogger) {
      this.props.customLogger(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError) {
      if (
        this.props.resetKeys &&
        JSON.stringify(prevProps.resetKeys) !==
          JSON.stringify(this.props.resetKeys)
      ) {
        this.setState({
          hasError: false,
          error: undefined,
          errorInfo: undefined,
          retryCount: 0,
        });
      }
    }
  }

  handleReportError = async () => {
    if (this.props.reportError && this.state.error && this.state.errorInfo) {
      this.setState({ isReporting: true });
      try {
        await this.props.reportError(this.state.error, this.state.errorInfo);
        alert(this.getTranslation("errorReported"));
      } catch {
        alert(this.getTranslation("reportErrorFailed"));
      } finally {
        this.setState({ isReporting: false });
      }
    }
  };

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    if (this.state.retryCount < maxRetries) {
      this.setState((prevState) => ({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: prevState.retryCount + 1,
      }));
    } else {
      alert(this.getTranslation("maxRetriesReached"));
    }
  };

  handleClose = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: 0,
    });
  };

  getTranslation = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      en: {
        errorOccurred: "Oops, an error occurred!",
        errorDetails: "View error details",
        retry: "Retry",
        reportError: "Report Error",
        errorReported: "Error reported successfully, thank you!",
        reportErrorFailed:
          "There was a problem reporting the error. Please try again later.",
        maxRetriesReached:
          "Maximum retry attempts reached. Please refresh the page.",
        errorTime: "Error occurred at:",
        close: "Close",
      },
      zh: {
        errorOccurred: "哎呀，出错了！",
        errorDetails: "查看错误详情",
        retry: "重试",
        reportError: "报告错误",
        errorReported: "错误已成功报告，谢谢！",
        reportErrorFailed: "报告错误时出现问题，请稍后再试。",
        maxRetriesReached: "已达到最大重试次数。请刷新页面。",
        errorTime: "错误发生时间：",
        close: "关闭",
      },
    };
    return translations[this.props.language || "en"][key] || key;
  };

  render(): ReactNode {
    const { children, useBlueScreen = true } = this.props;
    const { hasError, error, errorInfo, isReporting, retryCount } = this.state;

    if (hasError) {
      if (useBlueScreen) {
        return (
          <BlueScreen404
            error={error}
            errorInfo={errorInfo}
            isErrorBoundary={true}
          />
        );
      }

      const { theme = "dark" } = this.props;

      const errorModal = (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        >
          <motion.div
            className={`error-boundary w-full max-w-md p-8 rounded-xl shadow-2xl backdrop-blur-sm ring-1 ring-white/10 ${
              theme === "light" ? "bg-white" : "bg-gray-800"
            } ${this.props.customClassName || ""}`}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25,
            }}
          >
            <ErrorHeader
              title={this.getTranslation("errorOccurred")}
              errorMessage={this.state.error?.message}
              theme={theme}
              icon={<AlertTriangle className="w-6 h-6 text-red-500" />}
            />

            {this.props.showErrorDetails && (
              <ErrorDetails
                errorInfo={this.state.errorInfo?.componentStack?.toString()}
                theme={theme}
                onCopy={() => {
                  if (this.state.errorInfo?.componentStack) {
                    navigator.clipboard.writeText(
                      this.state.errorInfo.componentStack
                    );
                    alert("错误信息已复制到剪贴板");
                  }
                }}
              />
            )}

            {this.props.getSuggestion && this.state.error && (
              <div className="mt-6">
                <p className="text-sm font-medium text-blue-400">
                  {this.props.getSuggestion(this.state.error)}
                </p>
              </div>
            )}

            <ErrorActions
              onRetry={this.handleRetry}
              onReport={
                this.props.reportError ? this.handleReportError : undefined
              }
              onClose={this.handleClose}
              retryCount={retryCount}
              maxRetries={this.props.maxRetries}
              isReporting={isReporting}
              theme={theme}
            />
          </motion.div>
        </motion.div>
      );

      return (
        <>
          {children}
          <AnimatePresence>{this.props.fallback || errorModal}</AnimatePresence>
        </>
      );
    }

    return children;
  }
}

export default ErrorBoundary;

export const ErrorBoundaryProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [error, setError] = useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);

  const resetError = useCallback(() => {
    setError(null);
    setErrorInfo(null);
  }, []);

  return (
    <ErrorBoundaryContext.Provider value={{ error, errorInfo, resetError }}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </ErrorBoundaryContext.Provider>
  );
};
