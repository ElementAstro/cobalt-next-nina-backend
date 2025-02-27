import { io, Socket } from "socket.io-client";
import { parseStringPromise } from "xml2js";
import { EventEmitter } from "events";

export type INDIPropertyType = "number" | "switch" | "text" | "light" | "blob";

export enum INDIStatus {
  IDLE = "Idle",
  OK = "Ok",
  BUSY = "Busy",
  ALERT = "Alert",
}

export enum INDIMessageType {
  DEF_PROPERTY = "defProperty",
  SET_PROPERTY = "setProperty",
  NEW_PROPERTY = "newProperty",
  DEL_PROPERTY = "delProperty",
  GET_PROPERTIES = "getProperties",
  MESSAGE = "message",
}

// 定义基础接口
interface INDIBaseElement {
  value: string | number;
  label: string;
}

interface INDINumberElement extends INDIBaseElement {
  value: number;
  min: number;
  max: number;
  step: number;
  format: string;
}

interface INDISwitchElement extends INDIBaseElement {
  value: "On" | "Off";
  rule: string;
}

interface INDITextElement extends INDIBaseElement {
  value: string;
}

interface INDILightElement extends INDIBaseElement {
  value: INDIStatus;
}

interface INDIBLOBElement extends INDIBaseElement {
  value: string;
  format: string;
}

interface INDIProperty {
  name: string;
  label: string;
  groupName: string;
  state: string;
  permission: string;
  timeout: number;
  timestamp: string;
  type: INDIPropertyType;
  elements: Record<
    string,
    | INDINumberElement
    | INDISwitchElement
    | INDITextElement
    | INDILightElement
    | INDIBLOBElement
  >;
}

interface INDIDevice {
  name: string;
  properties: Record<string, INDIProperty>;
  connected: boolean;
}

interface INDIBaseMessage {
  $: {
    device: string;
    name?: string;
    timestamp?: string;
    state?: string;
    perm?: string;
    timeout?: string;
    label?: string;
    group?: string;
    rule?: string;
  };
  _?: string;
}

interface INDIVectorMessage extends INDIBaseMessage {
  oneText?: INDIElementMessage[] | INDIElementMessage;
  oneNumber?: INDIElementMessage[] | INDIElementMessage;
  oneSwitch?: INDIElementMessage[] | INDIElementMessage;
  oneLight?: INDIElementMessage[] | INDIElementMessage;
  oneBLOB?: INDIElementMessage[] | INDIElementMessage;
}

interface INDIElementMessage {
  $: {
    name: string;
    label?: string;
    min?: string;
    max?: string;
    step?: string;
    format?: string;
  };
  _: string;
}

interface INDIParsedMessage {
  defTextVector?: INDIVectorMessage;
  defNumberVector?: INDIVectorMessage;
  defSwitchVector?: INDIVectorMessage;
  defLightVector?: INDIVectorMessage;
  defBLOBVector?: INDIVectorMessage;
  setTextVector?: INDIVectorMessage;
  setNumberVector?: INDIVectorMessage;
  setSwitchVector?: INDIVectorMessage;
  setLightVector?: INDIVectorMessage;
  setBLOBVector?: INDIVectorMessage;
  message?: INDIBaseMessage;
  delProperty?: INDIBaseMessage;
}

export class INDIClient extends EventEmitter {
  private socket: Socket | null = null;
  private devices: Map<string, INDIDevice> = new Map();
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000; // ms

  constructor(private serverUrl: string) {
    super();
  }

  /**
   * 连接到INDI服务器
   */
  connect(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.socket) {
        this.socket.disconnect();
      }

      this.socket = io(this.serverUrl, {
        reconnection: false, // 我们手动处理重连逻辑
        timeout: 5000,
      });

      this.socket.on("connect", () => {
        console.log("Connected to INDI server");
        this.reconnectAttempts = 0;
        this.emit("connection", true);
        this.getDeviceList();
        resolve(true);
      });

      this.socket.on("connect_error", (err) => {
        console.error("Connection error:", err);
        this.handleReconnect();
        resolve(false);
      });

      this.socket.on("disconnect", () => {
        console.log("Disconnected from INDI server");
        this.emit("connection", false);
        this.handleReconnect();
      });

      this.socket.on("INDIMessage", async (xmlData: string) => {
        try {
          const result = await parseStringPromise(xmlData, {
            explicitArray: false,
          });
          this.processINDIMessage(result as INDIParsedMessage);
        } catch (err) {
          console.error("Error parsing INDI message:", err);
          this.emit("error", {
            type: "parse",
            message: "Error parsing INDI message",
            error: err,
          });
        }
      });
    });
  }

  /**
   * 断开与INDI服务器的连接
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    // 清空设备列表
    this.devices.clear();
    this.emit("devicesUpdated", []);
  }

  /**
   * 获取设备列表
   */
  getDeviceList(): void {
    this.sendCommand('<getProperties version="1.7" />');
  }

  /**
   * 连接到特定设备
   */
  connectDevice(deviceName: string): void {
    const command = `
      <newSwitchVector device="${deviceName}" name="CONNECTION">
        <oneSwitch name="CONNECT">On</oneSwitch>
        <oneSwitch name="DISCONNECT">Off</oneSwitch>
      </newSwitchVector>
    `;
    this.sendCommand(command);
  }

  /**
   * 断开特定设备
   */
  disconnectDevice(deviceName: string): void {
    const command = `
      <newSwitchVector device="${deviceName}" name="CONNECTION">
        <oneSwitch name="CONNECT">Off</oneSwitch>
        <oneSwitch name="DISCONNECT">On</oneSwitch>
      </newSwitchVector>
    `;
    this.sendCommand(command);
  }

  /**
   * 发送命令到INDI服务器
   */
  sendCommand(xmlCommand: string): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit("INDICommand", xmlCommand);
    } else {
      console.warn("Cannot send command: not connected to INDI server");
      this.emit("error", {
        type: "command",
        message: "Cannot send command: not connected to INDI server",
      });
    }
  }

  /**
   * 设置数值类型属性
   */
  setNumberProperty(
    device: string,
    property: string,
    elements: Record<string, number>
  ): void {
    let command = `<newNumberVector device="${device}" name="${property}">`;

    for (const [name, value] of Object.entries(elements)) {
      command += `<oneNumber name="${name}">${value}</oneNumber>`;
    }

    command += "</newNumberVector>";
    this.sendCommand(command);
  }

  /**
   * 设置开关类型属性
   */
  setSwitchProperty(
    device: string,
    property: string,
    elements: Record<string, string>
  ): void {
    let command = `<newSwitchVector device="${device}" name="${property}">`;

    for (const [name, value] of Object.entries(elements)) {
      command += `<oneSwitch name="${name}">${value}</oneSwitch>`;
    }

    command += "</newSwitchVector>";
    this.sendCommand(command);
  }

  /**
   * 设置文本类型属性
   */
  setTextProperty(
    device: string,
    property: string,
    elements: Record<string, string>
  ): void {
    let command = `<newTextVector device="${device}" name="${property}">`;

    for (const [name, value] of Object.entries(elements)) {
      command += `<oneText name="${name}">${value}</oneText>`;
    }

    command += "</newTextVector>";
    this.sendCommand(command);
  }

  /**
   * 处理INDI服务器消息
   */
  private processINDIMessage(data: INDIParsedMessage): void {
    // 检查消息类型
    if (data.defTextVector) {
      this.processDefTextVector(data.defTextVector);
    } else if (data.defNumberVector) {
      this.processDefNumberVector(data.defNumberVector);
    } else if (data.defSwitchVector) {
      this.processDefSwitchVector(data.defSwitchVector);
    } else if (data.defLightVector) {
      this.processDefLightVector(data.defLightVector);
    } else if (data.defBLOBVector) {
      this.processDefBLOBVector(data.defBLOBVector);
    } else if (data.setTextVector) {
      this.processSetTextVector(data.setTextVector);
    } else if (data.setNumberVector) {
      this.processSetNumberVector(data.setNumberVector);
    } else if (data.setSwitchVector) {
      this.processSetSwitchVector(data.setSwitchVector);
    } else if (data.setLightVector) {
      this.processSetLightVector(data.setLightVector);
    } else if (data.setBLOBVector) {
      this.processSetBLOBVector(data.setBLOBVector);
    } else if (data.message) {
      this.processMessage(data.message);
    } else if (data.delProperty) {
      this.processDelProperty(data.delProperty);
    }

    // 通知设备列表更新
    this.emitDevicesUpdated();
  }

  // 定义属性处理方法
  private processDefTextVector(data: INDIVectorMessage): void {
    this.updateDeviceProperty(data, "text");
  }

  private processDefNumberVector(data: INDIVectorMessage): void {
    this.updateDeviceProperty(data, "number");
  }

  private processDefSwitchVector(data: INDIVectorMessage): void {
    this.updateDeviceProperty(data, "switch");
  }

  private processDefLightVector(data: INDIVectorMessage): void {
    this.updateDeviceProperty(data, "light");
  }

  private processDefBLOBVector(data: INDIVectorMessage): void {
    this.updateDeviceProperty(data, "blob");
  }

  // 更新属性处理方法
  private processSetTextVector(data: INDIVectorMessage): void {
    this.updatePropertyValue(data, "text");
  }

  private processSetNumberVector(data: INDIVectorMessage): void {
    this.updatePropertyValue(data, "number");
  }

  private processSetSwitchVector(data: INDIVectorMessage): void {
    this.updatePropertyValue(data, "switch");
  }

  private processSetLightVector(data: INDIVectorMessage): void {
    this.updatePropertyValue(data, "light");
  }

  private processSetBLOBVector(data: INDIVectorMessage): void {
    this.updatePropertyValue(data, "blob");
  }

  private processMessage(data: INDIBaseMessage): void {
    this.emit("message", {
      device: data.$.device,
      timestamp: data.$.timestamp,
      message: data._,
    });
  }

  private processDelProperty(data: INDIBaseMessage): void {
    const deviceName = data.$.device;

    if (!deviceName) {
      // 删除所有设备
      this.devices.clear();
    } else if (data.$.name) {
      // 删除特定属性
      const device = this.devices.get(deviceName);
      if (device && device.properties) {
        delete device.properties[data.$.name];
      }
    } else {
      // 删除整个设备
      this.devices.delete(deviceName);
    }

    this.emitDevicesUpdated();
  }

  /**
   * 更新设备属性
   */
  private updateDeviceProperty(
    data: INDIVectorMessage,
    type: INDIPropertyType
  ): void {
    const deviceName = data.$.device;
    const propertyName = data.$.name || "";

    if (!this.devices.has(deviceName)) {
      this.devices.set(deviceName, {
        name: deviceName,
        properties: {},
        connected: false,
      });
    }

    const device = this.devices.get(deviceName);
    if (!device) return;

    // 处理属性元素
    const elements: Record<
      string,
      | INDINumberElement
      | INDISwitchElement
      | INDITextElement
      | INDILightElement
      | INDIBLOBElement
    > = {};

    const elementPropName = `one${
      type.charAt(0).toUpperCase() + type.slice(1)
    }` as keyof INDIVectorMessage;
    const elementList = data[elementPropName];

    // 确保元素列表总是数组
    const elemArray = Array.isArray(elementList)
      ? elementList
      : elementList
      ? [elementList]
      : [];

    elemArray.forEach((element) => {
      // Skip if element is not an object or doesn't have the expected structure
      if (
        typeof element === "string" ||
        !("$" in element) ||
        !element.$?.name
      ) {
        return;
      }
      const name = element.$.name;
      let value:
        | INDINumberElement
        | INDISwitchElement
        | INDITextElement
        | INDILightElement
        | INDIBLOBElement;

      switch (type) {
        case "number":
          value = {
            value: parseFloat(element._),
            min: parseFloat(element.$.min || "0"),
            max: parseFloat(element.$.max || "0"),
            step: parseFloat(element.$.step || "0"),
            format: element.$.format || "%g",
            label: element.$.label || name,
          } as INDINumberElement;
          break;
        case "switch":
          value = {
            value: element._ === "On" ? "On" : "Off",
            rule: data.$.rule || "OneOfMany",
            label: element.$.label || name,
          } as INDISwitchElement;
          break;
        case "text":
          value = {
            value: element._ || "",
            label: element.$.label || name,
          } as INDITextElement;
          break;
        case "light":
          value = {
            value: element._ as INDIStatus,
            label: element.$.label || name,
          } as INDILightElement;
          break;
        case "blob":
          value = {
            value: element._ || "",
            format: element.$.format || "",
            label: element.$.label || name,
          } as INDIBLOBElement;
          break;
        default:
          return;
      }

      elements[name] = value;
    });

    // 保存属性
    device.properties[propertyName] = {
      name: propertyName,
      label: data.$.label || propertyName,
      groupName: data.$.group || "Main",
      state: data.$.state || "Idle",
      permission: data.$.perm || "rw",
      timeout: data.$.timeout ? parseInt(data.$.timeout, 10) : 0,
      timestamp: data.$.timestamp || new Date().toISOString(),
      type: type,
      elements: elements,
    };

    // 检查是否是连接属性
    if (propertyName === "CONNECTION") {
      const connectedElement = elements["CONNECT"] as INDISwitchElement;
      if (connectedElement && connectedElement.value === "On") {
        device.connected = true;
      }
    }

    // 发出属性更新事件
    this.emit("propertyUpdated", {
      device: deviceName,
      property: propertyName,
      data: device.properties[propertyName],
    });
  }

  /**
   * 更新属性值
   */
  private updatePropertyValue(
    data: INDIVectorMessage,
    type: INDIPropertyType
  ): void {
    const deviceName = data.$.device;
    const propertyName = data.$.name || "";
    const device = this.devices.get(deviceName);

    if (!device || !device.properties[propertyName]) {
      console.warn(
        `Property ${propertyName} not found for device ${deviceName}`
      );
      return;
    }

    const property = device.properties[propertyName];
    const elements = property.elements;

    // 更新状态和时间戳
    if (data.$.state) {
      property.state = data.$.state;
    }
    property.timestamp = data.$.timestamp || new Date().toISOString();

    // 处理元素值
    const elementPropName = `one${
      type.charAt(0).toUpperCase() + type.slice(1)
    }` as keyof INDIVectorMessage;
    const elementList = data[elementPropName];

    // 确保元素列表总是数组
    const elemArray = Array.isArray(elementList)
      ? elementList
      : elementList
      ? [elementList]
      : [];

    elemArray.forEach((element) => {
      if (
        typeof element === "string" ||
        !("$" in element) ||
        !element.$?.name
      ) {
        return;
      }
      const name = element.$.name;
      if (elements[name]) {
        switch (type) {
          case "number":
            (elements[name] as INDINumberElement).value = parseFloat(element._);
            break;
          case "switch":
            (elements[name] as INDISwitchElement).value =
              element._ === "On" ? "On" : "Off";
            break;
          case "text":
            (elements[name] as INDITextElement).value = element._ || "";
            break;
          case "light":
            (elements[name] as INDILightElement).value =
              element._ as INDIStatus;
            break;
          case "blob":
            (elements[name] as INDIBLOBElement).value = element._ || "";
            break;
        }
      }
    });

    // 检查是否是连接属性
    if (propertyName === "CONNECTION") {
      const connectedElement = elements["CONNECT"] as INDISwitchElement;
      if (connectedElement) {
        device.connected = connectedElement.value === "On";
      }
    }

    // 发出属性更新事件
    this.emit("propertyUpdated", {
      device: deviceName,
      property: propertyName,
      data: property,
    });
  }

  /**
   * 发出设备列表更新事件
   */
  private emitDevicesUpdated(): void {
    const devicesList = Array.from(this.devices.values());
    this.emit("devicesUpdated", devicesList);
  }

  /**
   * 处理重连逻辑
   */
  private handleReconnect(): void {
    if (this.reconnectTimer) {
      return; // 已经在尝试重连
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn(
        `Failed to reconnect after ${this.reconnectAttempts} attempts`
      );
      this.emit("error", {
        type: "connection",
        message: `Failed to reconnect after ${this.reconnectAttempts} attempts`,
      });
      return;
    }

    this.reconnectAttempts++;
    const delay =
      this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);

    console.log(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /**
   * 获取当前连接的设备列表
   */
  getDevices(): INDIDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * 获取特定设备的信息
   */
  getDevice(deviceName: string): INDIDevice | undefined {
    return this.devices.get(deviceName);
  }
}
