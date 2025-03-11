// helpers.ts
import { nanoid } from "nanoid";
import { SerialTab } from "./types";

// Helper to create a new tab
export const createNewTab = (name = "New Connection"): SerialTab => ({
  id: nanoid(),
  name,
  port: "/dev/ttyS0",
  baudRate: "115200",
  terminalData: [],
  dataPoints: [],
  parsedMessages: [],
});
