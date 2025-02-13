import WebSocketClient from "./websocket-client";

// 定义基础消息接口
interface Message {
  topic: string;
  data: unknown;
}

// 消息处理器类型
type MessageHandler<T> = (message: T, topic?: string) => void;

// 中间件类型
type Middleware<T> = (message: T, topic: string, next: () => void) => void;

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

class MessageBus<T extends object> {
  private wsClient: WebSocketClient;
  private handlers: Map<string, Set<MessageHandler<T>>> = new Map();
  private middlewares: Middleware<T>[] = [];
  private logLevel: LogLevel = LogLevel.INFO;
  private maxRetries = 3;
  private retryDelay = 1000;

  constructor(
    wsClient: WebSocketClient,
    options: {
      logLevel?: LogLevel;
      maxRetries?: number;
      retryDelay?: number;
    } = {}
  ) {
    this.wsClient = wsClient;
    this.logLevel = options.logLevel || LogLevel.INFO;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.setupMessageHandling();
    this.log(LogLevel.INFO, "Initialized with WebSocket client");
  }

  private setupMessageHandling() {
    this.wsClient.on("message", async (data: unknown) => {
      this.log(LogLevel.DEBUG, "Received raw message:", data);

      let retries = 0;
      while (retries <= this.maxRetries) {
        try {
          const { topic, data: messageData } = this.parseMessage(data);
          this.log(
            LogLevel.DEBUG,
            `Parsed message for topic "${topic}":`,
            messageData
          );

          await this.runMiddlewares(messageData as T, topic);
          this.dispatch(topic, messageData as T);
          break;
        } catch (error) {
          retries++;
          if (retries > this.maxRetries) {
            this.log(LogLevel.ERROR, "Error handling message:", error);
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
        }
      }
    });
  }

  private async runMiddlewares(data: T, topic: string) {
    const executeMiddleware = (index: number): Promise<void> => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index];
        return new Promise<void>((resolve) => {
          middleware(data, topic, () => {
            resolve(executeMiddleware(index + 1));
          });
        });
      }
      return Promise.resolve();
    };
    await executeMiddleware(0);
  }

  private parseMessage(message: unknown): Message {
    if (typeof message === "string") {
      try {
        const parsed = JSON.parse(message);
        if (this.isValidMessage(parsed)) {
          return parsed;
        }
      } catch {
        // Not JSON, try base64
      }

      try {
        const decoded = atob(message);
        const parsed = JSON.parse(decoded);
        if (this.isValidMessage(parsed)) {
          return parsed;
        }
      } catch {
        // Not base64 or JSON
      }
    }
    return { topic: "default", data: message };
  }

  private isValidMessage(value: unknown): value is Message {
    return (
      typeof value === "object" &&
      value !== null &&
      "topic" in value &&
      "data" in value &&
      typeof value.topic === "string"
    );
  }

  private dispatch(topic: string, data: T) {
    const handlers = this.handlers.get(topic) || new Set();
    this.log(
      LogLevel.DEBUG,
      `Dispatching message to ${handlers.size} handlers for topic "${topic}":`,
      data
    );

    handlers.forEach((handler) => {
      try {
        handler(data, topic);
      } catch (error) {
        this.log(
          LogLevel.ERROR,
          `Error in handler for topic "${topic}":`,
          error
        );
      }
    });
  }

  public use(middleware: Middleware<T>) {
    this.middlewares.push(middleware);
    return this;
  }

  public setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }

  private log(level: LogLevel, ...args: unknown[]) {
    if (this.shouldLog(level)) {
      console[level](`[MessageBus]`, ...args);
    }
  }

  private shouldLog(level: LogLevel) {
    const levels = Object.values(LogLevel);
    return levels.indexOf(level) >= levels.indexOf(this.logLevel);
  }

  public subscribe(topic: string, handler: MessageHandler<T>) {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, new Set());
    }
    this.handlers.get(topic)?.add(handler);
    this.log(LogLevel.DEBUG, `Subscribed to topic "${topic}"`);
    return () => this.unsubscribe(topic, handler);
  }

  public unsubscribe(topic: string, handler: MessageHandler<T>) {
    const handlers = this.handlers.get(topic);
    if (handlers) {
      handlers.delete(handler);
      this.log(LogLevel.DEBUG, `Unsubscribed from topic "${topic}"`);

      if (handlers.size === 0) {
        this.handlers.delete(topic);
        this.log(
          LogLevel.DEBUG,
          `No more handlers for topic "${topic}", topic removed`
        );
      }
    }
  }

  public publish(topic: string, message: T) {
    const payload = {
      type: "message",
      payload: { topic, data: message },
    };
    this.wsClient.send(payload);
    this.log(LogLevel.DEBUG, `Published message to topic "${topic}":`, message);
  }

  public getTopics(): string[] {
    const topics = Array.from(this.handlers.keys());
    this.log(LogLevel.DEBUG, "Retrieved topics:", topics);
    return topics;
  }

  public clearTopic(topic: string) {
    const handlers = this.handlers.get(topic);
    if (handlers) {
      this.handlers.delete(topic);
      this.log(
        LogLevel.DEBUG,
        `Cleared topic "${topic}" with ${handlers.size} handlers`
      );
    }
  }
}

export default MessageBus;
