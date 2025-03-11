"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useSerialStore } from "@/stores/serial";
import { Sliders } from "lucide-react";

export function SimulationControls() {
  const {
    isSimulationMode,
    setIsSimulationMode,
    simulationScenario,
    setSimulationScenario,
    addTerminalData,
  } = useSerialStore();

  const [isOpen, setIsOpen] = useState(false);

  const handleSimulationToggle = (checked: boolean) => {
    setIsSimulationMode(checked);
    if (checked) {
      addTerminalData("--- Simulation Mode Activated ---");
      addTerminalData("Type 'help' to see available commands");
    } else {
      addTerminalData("--- Simulation Mode Deactivated ---");
    }
  };

  const runScenario = () => {
    addTerminalData(`--- Running Scenario: ${simulationScenario} ---`);

    if (simulationScenario === "bootup") {
      const bootSequence = [
        "Initializing system...",
        "Checking hardware components...",
        "CPU: OK",
        "Memory: 512KB available",
        "Storage: 2MB available",
        "Loading firmware v1.2.3...",
        "Calibrating sensors...",
        "System boot complete.",
      ];

      let delay = 0;
      bootSequence.forEach((line) => {
        setTimeout(() => {
          addTerminalData(line);
        }, delay);
        delay += 500;
      });
    } else if (simulationScenario === "error") {
      const errorSequence = [
        "System running normally...",
        "WARNING: Temperature sensor reading high",
        "ERROR: Temperature exceeds threshold",
        "Initiating emergency shutdown...",
        "System halted.",
      ];

      let delay = 0;
      errorSequence.forEach((line) => {
        setTimeout(() => {
          addTerminalData(line);
        }, delay);
        delay += 800;
      });
    } else if (simulationScenario === "data") {
      // Generate periodic data readings
      let count = 0;
      const interval = setInterval(() => {
        const temp = Math.round(20 + Math.random() * 10);
        const humidity = Math.round(40 + Math.random() * 20);
        const pressure = Math.round(990 + Math.random() * 30);

        addTerminalData(
          `Reading #${count}: Temp=${temp}°C, Humidity=${humidity}%, Pressure=${pressure}hPa`
        );

        count++;
        if (count >= 10) {
          clearInterval(interval);
          addTerminalData("--- Data collection complete ---");
        }
      }, 1000);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={`h-8 w-8 ${
            isSimulationMode
              ? "bg-amber-600 border-amber-700"
              : "bg-[#1a2b3d] border-[#2a3b4d]"
          }`}
        >
          <Sliders className="h-4 w-4" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="bg-[#0a1929] text-white border-t border-gray-700">
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle className="text-white">模拟控制</DrawerTitle>
            <DrawerDescription className="text-gray-400">
              配置模拟模式设置和场景
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <div className="flex items-center justify-between mb-6">
              <Label htmlFor="simulation-mode" className="text-white">
                模拟模式
              </Label>
              <Switch
                id="simulation-mode"
                checked={isSimulationMode}
                onCheckedChange={handleSimulationToggle}
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="scenario" className="text-white">
                  模拟场景
                </Label>
                <Select
                  value={simulationScenario}
                  onValueChange={setSimulationScenario}
                  disabled={!isSimulationMode}
                >
                  <SelectTrigger
                    id="scenario"
                    className="w-full bg-[#1a2b3d] border-[#2a3b4d] text-white"
                  >
                    <SelectValue placeholder="选择场景" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a2b3d] border-[#2a3b4d] text-white">
                    <SelectItem value="default">默认</SelectItem>
                    <SelectItem value="bootup">启动序列</SelectItem>
                    <SelectItem value="error">错误场景</SelectItem>
                    <SelectItem value="data">数据流</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                disabled={!isSimulationMode}
                onClick={runScenario}
              >
                运行场景
              </Button>
            </div>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline" className="border-gray-700 text-white">
                关闭
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
