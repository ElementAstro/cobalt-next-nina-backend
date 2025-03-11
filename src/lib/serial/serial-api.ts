// Serial API interface for browser WebSerial API and backend communication

import type { SerialOptions } from "@/types/serial";

// 添加 SerialPort 和 Navigator 类型扩展
interface SerialPort {
  open(options: SerialPortOpenOptions): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
}

interface SerialPortOpenOptions {
  baudRate: number;
  dataBits?: number;
  stopBits?: number;
  parity?: string;
  flowControl?: string;
}

// 扩展 Navigator 类型
interface SerialAPI {
  getPorts(): Promise<SerialPort[]>;
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
}

interface SerialPortRequestOptions {
  filters?: Array<{
    usbVendorId?: number;
    usbProductId?: number;
  }>;
}

interface NavigatorWithSerial extends Navigator {
  serial: SerialAPI;
}

// WebSerial API support
export class SerialConnection {
  port: SerialPort | null = null;
  reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  readableStreamClosed: Promise<void> | null = null;
  writableStreamClosed: Promise<void> | null = null;
  keepReading = false;
  onDataCallback: ((data: string) => void) | null = null;
  onDisconnectCallback: (() => void) | null = null;

  constructor() {
    // Check if WebSerial API is supported
    if (!("serial" in navigator)) {
      console.warn("WebSerial API not supported in this browser");
    }
  }

  async requestPort(): Promise<SerialPort | null> {
    if (!("serial" in navigator)) return null;

    try {
      // Request user to select a serial port
      this.port = await (navigator as NavigatorWithSerial).serial.requestPort();
      return this.port;
    } catch (error) {
      console.error("Error requesting serial port:", error);
      return null;
    }
  }

  async getPorts(): Promise<SerialPort[]> {
    if (!("serial" in navigator)) return [];

    try {
      return await (navigator as NavigatorWithSerial).serial.getPorts();
    } catch (error) {
      console.error("Error getting serial ports:", error);
      return [];
    }
  }

  async connect(options: SerialOptions): Promise<boolean> {
    if (!this.port) {
      console.error("No port selected");
      return false;
    }

    try {
      // Configure the port
      await this.port.open({
        baudRate: Number.parseInt(options.baudRate),
        dataBits: options.dataBits || 8,
        stopBits: options.stopBits || 1,
        parity: options.parity || "none",
        flowControl: options.flowControl || "none",
      });

      // Setup reading
      this.setupReading();

      return true;
    } catch (error) {
      console.error("Error opening serial port:", error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.keepReading = false;

    // Close the reading stream
    if (this.reader) {
      await this.reader.cancel();
      this.reader = null;
    }

    // Close the writing stream
    if (this.writer) {
      await this.writer.close();
      this.writer = null;
    }

    // Wait for the streams to close
    if (this.readableStreamClosed) {
      await this.readableStreamClosed;
      this.readableStreamClosed = null;
    }

    if (this.writableStreamClosed) {
      await this.writableStreamClosed;
      this.writableStreamClosed = null;
    }

    // Close the port
    if (this.port?.readable && this.port?.writable) {
      await this.port.close();
    }

    // Call disconnect callback
    if (this.onDisconnectCallback) {
      this.onDisconnectCallback();
    }
  }

  async write(data: string, lineEnding = ""): Promise<boolean> {
    if (!this.port?.writable) {
      console.error("Port is not writable");
      return false;
    }

    try {
      // Add line ending if specified
      let fullData = data;
      if (lineEnding === "nl") fullData += "\n";
      else if (lineEnding === "cr") fullData += "\r";
      else if (lineEnding === "crnl") fullData += "\r\n";

      // Convert string to Uint8Array
      const encoder = new TextEncoder();
      const dataArray = encoder.encode(fullData);

      // Get writer if not already available
      if (!this.writer) {
        const writable = this.port.writable;
        this.writer = writable.getWriter();
      }

      // 确保 writer 不为 null
      if (this.writer) {
        this.writableStreamClosed = this.writer.closed;
        await this.writer.write(dataArray);
      } else {
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error writing to serial port:", error);
      return false;
    }
  }

  async writeSpecialCommand(command: string): Promise<boolean> {
    if (!this.port?.writable) {
      console.error("Port is not writable");
      return false;
    }

    try {
      // Handle special commands like Ctrl+C, Ctrl+D, etc.
      let specialByte: number | null = null;

      if (command === "^C") specialByte = 0x03; // Ctrl+C
      else if (command === "^D") specialByte = 0x04; // Ctrl+D
      else if (command === "^Z") specialByte = 0x1a; // Ctrl+Z

      if (specialByte === null) {
        console.error("Unknown special command:", command);
        return false;
      }

      // Get writer if not already available
      if (!this.writer) {
        const writable = this.port.writable;
        this.writer = writable.getWriter();
      }

      // 确保 writer 不为 null
      if (this.writer) {
        this.writableStreamClosed = this.writer.closed;
        await this.writer.write(new Uint8Array([specialByte]));
      } else {
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error writing special command to serial port:", error);
      return false;
    }
  }

  onData(callback: (data: string) => void): void {
    this.onDataCallback = callback;
  }

  onDisconnect(callback: () => void): void {
    this.onDisconnectCallback = callback;
  }

  private async setupReading(): Promise<void> {
    if (!this.port?.readable) {
      console.error("Port is not readable");
      return;
    }

    // Start reading
    this.keepReading = true;

    while (this.port.readable && this.keepReading) {
      try {
        const readable = this.port.readable;
        this.reader = readable.getReader();

        // 确保 reader 不为 null
        if (this.reader) {
          this.readableStreamClosed = this.reader.closed;

          // Listen to data coming from the serial port
          while (this.keepReading) {
            const { value, done } = await this.reader.read();

            if (done) {
              // Reader has been canceled
              break;
            }

            // Convert received data to string
            const decoder = new TextDecoder();
            const text = decoder.decode(value);

            // Call data callback
            if (this.onDataCallback) {
              this.onDataCallback(text);
            }
          }
        }
      } catch (error) {
        console.error("Error reading from serial port:", error);
      } finally {
        // Release the reader
        if (this.reader) {
          this.reader.releaseLock();
          this.reader = null;
        }
      }
    }
  }
}

// Backend API for server-based serial communication
export class BackendSerialAPI {
  private baseUrl: string;
  private websocket: WebSocket | null = null;
  private onDataCallback: ((data: string) => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;

  constructor(baseUrl = "/api/serial") {
    this.baseUrl = baseUrl;
  }

  async getPorts(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/ports`);
      const data = await response.json();
      return data.ports || [];
    } catch (error) {
      console.error("Error fetching ports from backend:", error);
      return [];
    }
  }

  async connect(port: string, options: SerialOptions): Promise<boolean> {
    try {
      // First, establish HTTP connection
      const response = await fetch(`${this.baseUrl}/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          port,
          baudRate: options.baudRate,
          dataBits: options.dataBits || 8,
          stopBits: options.stopBits || 1,
          parity: options.parity || "none",
          flowControl: options.flowControl || "none",
        }),
      });

      const data = await response.json();

      if (!data.success) {
        console.error("Failed to connect:", data.error);
        return false;
      }

      // Then establish WebSocket connection for real-time data
      const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${wsProtocol}//${window.location.host}${
        this.baseUrl
      }/ws?port=${encodeURIComponent(port)}`;

      this.websocket = new WebSocket(wsUrl);

      this.websocket.onmessage = (event) => {
        if (this.onDataCallback) {
          this.onDataCallback(event.data);
        }
      };

      this.websocket.onclose = () => {
        if (this.onDisconnectCallback) {
          this.onDisconnectCallback();
        }
      };

      return true;
    } catch (error) {
      console.error("Error connecting to serial port via backend:", error);
      return false;
    }
  }

  async disconnect(): Promise<boolean> {
    try {
      // Close WebSocket
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
      }

      // Notify backend
      const response = await fetch(`${this.baseUrl}/disconnect`, {
        method: "POST",
      });

      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error("Error disconnecting from serial port via backend:", error);
      return false;
    }
  }

  async write(data: string, lineEnding = ""): Promise<boolean> {
    try {
      // Add line ending if specified
      let fullData = data;
      if (lineEnding === "nl") fullData += "\n";
      else if (lineEnding === "cr") fullData += "\r";
      else if (lineEnding === "crnl") fullData += "\r\n";

      const response = await fetch(`${this.baseUrl}/write`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          data: fullData,
        }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Error writing to serial port via backend:", error);
      return false;
    }
  }

  async writeSpecialCommand(command: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/special-command`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          command,
        }),
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Error sending special command via backend:", error);
      return false;
    }
  }

  onData(callback: (data: string) => void): void {
    this.onDataCallback = callback;
  }

  onDisconnect(callback: () => void): void {
    this.onDisconnectCallback = callback;
  }
}

// Factory function to create the appropriate serial interface
export function createSerialInterface(
  useBackend = false,
  backendUrl = "/api/serial"
): SerialConnection | BackendSerialAPI {
  if (useBackend) {
    return new BackendSerialAPI(backendUrl);
  } else {
    return new SerialConnection();
  }
}
