export interface SerialOptions {
  baudRate: string;
  dataBits?: number;
  stopBits?: number;
  parity?: "none" | "even" | "odd";
  flowControl?: "none" | "hardware";
}

export interface ProtocolParserOptions {
  type: "modbus" | "i2c" | "spi" | "can" | "custom";
  customParser?: (data: Uint8Array) => unknown;
  settings?: Record<string, unknown>;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  text: string;
  type?: string;
  raw?: Uint8Array;
}

export interface DeviceProfile {
  id: string;
  name: string;
  port: string;
  baudRate: string;
  dataBits: number;
  stopBits: number;
  parity: "none" | "even" | "odd";
  flowControl: "none" | "hardware";
  parser?: ProtocolParserOptions;
  macros?: {
    id: string;
    name: string;
    command: string;
    shortcut?: string;
  }[];
}

export interface SerialSession {
  id: string;
  deviceProfileId: string;
  startTime: number;
  endTime?: number;
  logs: LogEntry[];
}
