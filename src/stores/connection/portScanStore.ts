import { create } from "zustand";

export interface ScanResult {
  port: number;
  status: "open" | "closed";
  service?: string;
}

export interface ScanHistory {
  id: string;
  date: string;
  ipAddress: string;
  openPorts: number;
}

interface PortScanState {
  progress: number;
  status: string;
  isScanning: boolean;
  scanResults: ScanResult[];
  ipAddress: string;
  portRange: string;
  customPortRange: string;
  scanSpeed: "fast" | "normal" | "thorough";
  timeout: number;
  concurrentScans: number;
  showClosedPorts: boolean;
  scanHistory: ScanHistory[];
  selectedInterface: string;
  networkInterfaces: string[];
  resetScan: () => void;
  setIpAddress: (ip: string) => void;
  setPortRange: (range: string) => void;
  setProgress: (progress: number) => void;
  setStatus: (status: string) => void;
  setIsScanning: (scanning: boolean) => void;
  setScanResults: (results: ScanResult[]) => void;
  setCustomPortRange: (range: string) => void;
  setScanSpeed: (speed: "fast" | "normal" | "thorough") => void;
  setTimeoutValue: (timeout: number) => void;
  setConcurrentScans: (count: number) => void;
  setShowClosedPorts: (show: boolean) => void;
  setScanHistory: (history: ScanHistory[]) => void;
  setSelectedInterface: (iface: string) => void;
  setNetworkInterfaces: (ifaces: string[]) => void;
}

export const usePortScanStore = create<PortScanState>((set) => ({
  progress: 0,
  status: "准备扫描...",
  isScanning: false,
  scanResults: [],
  ipAddress: "",
  portRange: "common",
  customPortRange: "1-100",
  scanSpeed: "normal",
  timeout: 2000,
  concurrentScans: 10,
  showClosedPorts: false,
  scanHistory: [],
  selectedInterface: "",
  networkInterfaces: [],
  resetScan: () =>
    set({
      progress: 0,
      status: "准备扫描...",
      scanResults: [],
    }),
  setIpAddress: (ip) => set({ ipAddress: ip }),
  setPortRange: (range) => set({ portRange: range }),
  setProgress: (progress) => set({ progress }),
  setStatus: (status) => set({ status }),
  setIsScanning: (scanning) => set({ isScanning: scanning }),
  setScanResults: (results) => set({ scanResults: results }),
  setCustomPortRange: (range) => set({ customPortRange: range }),
  setScanSpeed: (speed) => set({ scanSpeed: speed }),
  setTimeoutValue: (timeout) => set({ timeout }),
  setConcurrentScans: (count) => set({ concurrentScans: count }),
  setShowClosedPorts: (show) => set({ showClosedPorts: show }),
  setScanHistory: (history) => set({ scanHistory: history }),
  setSelectedInterface: (iface) => set({ selectedInterface: iface }),
  setNetworkInterfaces: (ifaces) => set({ networkInterfaces: ifaces }),
}));
