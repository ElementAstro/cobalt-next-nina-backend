// Protocol parsers for common serial protocols

import type { ProtocolParserOptions } from "@/types/serial";

// 定义解析结果的通用类型
export interface ParseResult {
  valid: boolean;
  error?: string;
  [key: string]: unknown;
}

// Base parser interface
export interface ProtocolParser {
  parse(data: Uint8Array): ParseResult;
  getDescription(): string;
}

// MODBUS parser
export class ModbusParser implements ProtocolParser {
  private settings: Record<string, unknown>;

  constructor(settings: Record<string, unknown> = {}) {
    this.settings = {
      mode: "rtu", // 'rtu' or 'ascii'
      ...settings,
    };
  }

  parse(data: Uint8Array): ParseResult {
    // Basic MODBUS frame parsing
    if (data.length < 4) {
      return { valid: false, error: "Frame too short" };
    }

    const slaveAddress = data[0];
    const functionCode = data[1];

    // Different parsing based on function code
    const result: ParseResult = {
      valid: true,
      slaveAddress,
      functionCode,
      raw: Array.from(data),
    };

    // Check if it's an error response
    if (functionCode > 0x80) {
      result.isError = true;
      result.errorCode = data[2];
      result.errorMessage = this.getErrorMessage(data[2]);
      return result;
    }

    // Parse based on function code
    switch (functionCode) {
      case 0x01: // Read Coils
      case 0x02: // Read Discrete Inputs
        result.byteCount = data[2];
        result.values = [];

        for (let i = 0; i < (result.byteCount as number); i++) {
          const byte = data[3 + i];
          for (let bit = 0; bit < 8; bit++) {
            if (3 + i < data.length) {
              (result.values as number[]).push((byte >> bit) & 1);
            }
          }
        }
        break;

      case 0x03: // Read Holding Registers
      case 0x04: // Read Input Registers
        result.byteCount = data[2];
        result.registers = [];

        for (let i = 0; i < (result.byteCount as number) / 2; i++) {
          if (3 + i * 2 + 1 < data.length) {
            const high = data[3 + i * 2];
            const low = data[3 + i * 2 + 1];
            (result.registers as number[]).push((high << 8) | low);
          }
        }
        break;

      case 0x05: // Write Single Coil
      case 0x06: // Write Single Register
        if (data.length >= 6) {
          result.address = (data[2] << 8) | data[3];
          result.value = (data[4] << 8) | data[5];
        }
        break;

      case 0x0f: // Write Multiple Coils
      case 0x10: // Write Multiple Registers
        if (data.length >= 6) {
          result.address = (data[2] << 8) | data[3];
          result.quantity = (data[4] << 8) | data[5];
        }
        break;

      default:
        result.data = Array.from(data.slice(2, data.length - 2));
    }

    // Check CRC for RTU mode
    if (this.settings.mode === "rtu" && data.length >= 2) {
      const crc = this.calculateCRC(data.slice(0, data.length - 2));
      const receivedCrc = (data[data.length - 1] << 8) | data[data.length - 2];
      result.crcValid = crc === receivedCrc;
    }

    return result;
  }

  getDescription(): string {
    return `MODBUS ${(this.settings.mode as string).toUpperCase()} Parser`;
  }

  private calculateCRC(data: Uint8Array): number {
    let crc = 0xffff;

    for (let i = 0; i < data.length; i++) {
      crc ^= data[i];

      for (let j = 0; j < 8; j++) {
        if ((crc & 0x0001) !== 0) {
          crc >>= 1;
          crc ^= 0xa001;
        } else {
          crc >>= 1;
        }
      }
    }

    return crc;
  }

  private getErrorMessage(errorCode: number): string {
    switch (errorCode) {
      case 0x01:
        return "Illegal Function";
      case 0x02:
        return "Illegal Data Address";
      case 0x03:
        return "Illegal Data Value";
      case 0x04:
        return "Slave Device Failure";
      case 0x05:
        return "Acknowledge";
      case 0x06:
        return "Slave Device Busy";
      case 0x08:
        return "Memory Parity Error";
      case 0x0a:
        return "Gateway Path Unavailable";
      case 0x0b:
        return "Gateway Target Device Failed to Respond";
      default:
        return "Unknown Error";
    }
  }
}

// I2C parser
export class I2CParser implements ProtocolParser {
  private settings: Record<string, unknown>;

  constructor(settings: Record<string, unknown> = {}) {
    this.settings = {
      addressSize: 7, // 7 or 10 bits
      ...settings,
    };
  }

  parse(data: Uint8Array): ParseResult {
    if (data.length < 2) {
      return { valid: false, error: "Frame too short" };
    }

    // Basic I2C frame parsing
    const address = data[0] >> 1;
    const isRead = (data[0] & 0x01) === 1;

    return {
      valid: true,
      address,
      operation: isRead ? "read" : "write",
      data: Array.from(data.slice(1)),
      raw: Array.from(data),
    };
  }

  getDescription(): string {
    return `I2C Parser (${this.settings.addressSize as number}-bit addressing)`;
  }
}

// SPI parser
export class SPIParser implements ProtocolParser {
  private settings: Record<string, unknown>;

  constructor(settings: Record<string, unknown> = {}) {
    this.settings = {
      mode: 0, // 0, 1, 2, or 3
      ...settings,
    };
  }

  parse(data: Uint8Array): ParseResult {
    // SPI doesn't have a standard frame format, so we just return the raw data
    return {
      valid: true,
      data: Array.from(data),
      raw: Array.from(data),
    };
  }

  getDescription(): string {
    return `SPI Parser (Mode ${this.settings.mode as number})`;
  }
}

// CAN parser
export class CANParser implements ProtocolParser {
  private settings: Record<string, unknown>;

  constructor(settings: Record<string, unknown> = {}) {
    this.settings = {
      extended: false, // Standard or extended frame format
      ...settings,
    };
  }

  parse(data: Uint8Array): ParseResult {
    if (data.length < 3) {
      return { valid: false, error: "Frame too short" };
    }

    // Basic CAN frame parsing
    let identifier: number;
    let dataStartIndex: number;

    if (this.settings.extended as boolean) {
      // Extended frame format (29-bit identifier)
      identifier =
        (data[0] << 21) | (data[1] << 13) | (data[2] << 5) | (data[3] >> 3);
      dataStartIndex = 4;
    } else {
      // Standard frame format (11-bit identifier)
      identifier = (data[0] << 3) | (data[1] >> 5);
      dataStartIndex = 2;
    }

    const dlc = data[dataStartIndex - 1] & 0x0f; // Data Length Code
    const isRemoteFrame = ((data[dataStartIndex - 1] >> 4) & 0x01) === 1;

    return {
      valid: true,
      identifier,
      format: this.settings.extended ? "extended" : "standard",
      isRemoteFrame,
      dlc,
      data: Array.from(data.slice(dataStartIndex, dataStartIndex + dlc)),
      raw: Array.from(data),
    };
  }

  getDescription(): string {
    return `CAN Parser (${
      this.settings.extended ? "Extended" : "Standard"
    } Format)`;
  }
}

// Custom parser wrapper
export class CustomParser implements ProtocolParser {
  private parserFn: (data: Uint8Array) => unknown;
  private description: string;

  constructor(
    parserFn: (data: Uint8Array) => unknown,
    description = "Custom Parser"
  ) {
    this.parserFn = parserFn;
    this.description = description;
  }

  parse(data: Uint8Array): ParseResult {
    try {
      const result = this.parserFn(data);
      if (typeof result === "object" && result !== null && "valid" in result) {
        return result as ParseResult;
      }
      return { valid: true, result };
    } catch (error) {
      console.error("Error in custom parser:", error);
      return { valid: false, error: "Custom parser error" };
    }
  }

  getDescription(): string {
    return this.description;
  }
}

// Factory function to create the appropriate parser
export function createProtocolParser(
  options: ProtocolParserOptions
): ProtocolParser {
  switch (options.type) {
    case "modbus":
      return new ModbusParser(options.settings || {});
    case "i2c":
      return new I2CParser(options.settings || {});
    case "spi":
      return new SPIParser(options.settings || {});
    case "can":
      return new CANParser(options.settings || {});
    case "custom":
      if (options.customParser) {
        // 修复这里的类型错误
        const description =
          typeof options.settings?.description === "string"
            ? options.settings.description
            : "Custom Parser";
        return new CustomParser(options.customParser, description);
      }
      throw new Error("Custom parser function not provided");
    default:
      throw new Error(`Unknown parser type: ${options.type as string}`);
  }
}
