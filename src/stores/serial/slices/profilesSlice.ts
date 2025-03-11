import { StateCreator } from "zustand";
import { SerialState } from "@/types/serial/types";
import { DeviceProfile } from "@/types/serial";

export interface ProfilesSlice {
  loadDeviceProfile: (profile: DeviceProfile) => void;
}

export const createProfilesSlice: StateCreator<
  SerialState,
  [],
  [],
  ProfilesSlice
> = (set) => ({
  loadDeviceProfile: (profile) => {
    // Update the active tab with the profile settings
    set((state) => {
      const activeTabIndex = state.tabs.findIndex(
        (tab) => tab.id === state.activeTabId
      );
      if (activeTabIndex === -1) return state;

      const updatedTabs = [...state.tabs];
      updatedTabs[activeTabIndex] = {
        ...updatedTabs[activeTabIndex],
        name: profile.name,
        port: profile.port,
        baudRate: profile.baudRate,
      };

      // Update macros if provided
      const updatedState: Partial<SerialState> = { tabs: updatedTabs };

      if (profile.macros && profile.macros.length > 0) {
        updatedState.macros = profile.macros;
      }

      // Update parser if provided
      if (profile.parser) {
        updatedState.protocolParser = profile.parser;
      }

      return updatedState;
    });
  },
});
