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
  ChevronDown as ChevronDownIcon,
  RefreshCw as RefreshCwIcon,
  Bug as BugPlayIcon,
  Loader as LoaderIcon,
  X as XIcon
} from "lucide-react";
import BlueScreen404 from "./blue-screen-404";

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
  showStack: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isReporting: false,
      retryCount: 0,
      showStack: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorTime: new Date(),
      showStack: false
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
          showStack: false,
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
        showStack: false,
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
      showStack: false,
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
    const { hasError, error, errorInfo } = this.state;

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
      const bgColor = theme === "light" ? "bg-white" : "bg-gray-800";
      const textColor = theme === "light" ? "text-gray-800" : "text-gray-200";

      const errorModal = (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        >
          <motion.div
            className={`error-boundary w-full max-w-md p-8 rounded-xl shadow-2xl backdrop-blur-sm ring-1 ring-white/10 ${bgColor} ${textColor} ${
              this.props.customClassName || ""
            }`}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
          >
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {this.getTranslation("errorOccurred")}
                </h1>
              </div>
              <div className="space-y-2">
                <p className="text-base/relaxed font-medium text-red-500/90">
                  {this.state.error?.message}
                </p>
                {this.state.errorTime && (
                  <p className="text-sm/relaxed text-white/60">
                    {this.getTranslation("errorTime")}{" "}
                    <time dateTime={this.state.errorTime.toISOString()}>
                      {this.state.errorTime.toLocaleString()}
                    </time>
                  </p>
                )}
              </div>
            </div>
            {this.props.showErrorDetails && (
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => this.setState({ showStack: !this.state.showStack })}
                  className="flex items-center space-x-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <span>{this.getTranslation("errorDetails")}</span>
                  <motion.div
                    animate={{ rotate: this.state.showStack ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <ChevronDownIcon className="w-4 h-4" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {this.state.showStack && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    >
                      <pre
                        className={`p-4 rounded-lg font-mono text-sm overflow-x-auto ${
                          theme === "light"
                            ? "bg-gray-100/80 text-gray-800"
                            : "bg-gray-800/80 text-gray-200"
                        }`}
                      >
                        {this.state.errorInfo?.componentStack}
                      </pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
            
            {this.props.getSuggestion && this.state.error && (
              <div className="mt-6">
                <p className="text-sm font-medium text-blue-400">
                  {this.props.getSuggestion(this.state.error)}
                </p>
              </div>
            )}
            
            <div className="mt-8 flex flex-wrap gap-3">
              <motion.button
                className={`
                  inline-flex items-center justify-center rounded-lg px-4 py-2
                  bg-blue-500/90 hover:bg-blue-500 text-white font-medium
                  shadow-lg shadow-blue-500/20
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  disabled:opacity-50 disabled:pointer-events-none
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={this.handleRetry}
              >
                <RefreshCwIcon className="w-4 h-4 mr-2" />
                {this.getTranslation("retry")} ({this.state.retryCount}/{this.props.maxRetries || 3})
              </motion.button>
              
              {this.props.reportError && (
                <motion.button
                  className={`
                    inline-flex items-center justify-center rounded-lg px-4 py-2
                    bg-emerald-500/90 hover:bg-emerald-500 text-white font-medium
                    shadow-lg shadow-emerald-500/20
                    transition-all duration-200
                    focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
                    disabled:opacity-50 disabled:pointer-events-none
                  `}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={this.handleReportError}
                  disabled={this.state.isReporting}
                >
                  <BugPlayIcon className="w-4 h-4 mr-2" />
                  {this.state.isReporting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <LoaderIcon className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    this.getTranslation("reportError")
                  )}
                </motion.button>
              )}
              
              <motion.button
                className={`
                  inline-flex items-center justify-center rounded-lg px-4 py-2
                  bg-gray-500/90 hover:bg-gray-500 text-white font-medium
                  shadow-lg shadow-gray-500/20
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={this.handleClose}
              >
                <XIcon className="w-4 h-4 mr-2" />
                {this.getTranslation("close")}
              </motion.button>
            </div>
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
