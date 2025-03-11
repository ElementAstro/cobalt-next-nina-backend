import { StateCreator } from "zustand";
import { SerialState } from "@/types/serial/types";

export interface SimulationSlice {
  setIsSimulationMode: (isSimulationMode: boolean) => void;
  setSimulationScenario: (scenario: string) => void;
}

export const createSimulationSlice: StateCreator<
  SerialState,
  [],
  [],
  SimulationSlice
> = (set) => ({
  setIsSimulationMode: (isSimulationMode) => set({ isSimulationMode }),

  setSimulationScenario: (simulationScenario) => set({ simulationScenario }),
});
