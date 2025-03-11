import { StateCreator } from "zustand";
import { SerialState } from "@/types/serial/types";
import { nanoid } from "nanoid";

export interface MacrosSlice {
  addMacro: (name: string, command: string, shortcut?: string) => void;
  removeMacro: (id: string) => void;
  updateMacro: (
    id: string,
    name: string,
    command: string,
    shortcut?: string
  ) => void;
  executeMacro: (id: string) => void;
}

export const createMacrosSlice: StateCreator<
  SerialState,
  [],
  [],
  MacrosSlice
> = (set, get) => ({
  addMacro: (name, command, shortcut) =>
    set((state) => ({
      macros: [...state.macros, { id: nanoid(), name, command, shortcut }],
    })),

  removeMacro: (id) =>
    set((state) => ({
      macros: state.macros.filter((macro) => macro.id !== id),
    })),

  updateMacro: (id, name, command, shortcut) =>
    set((state) => ({
      macros: state.macros.map((macro) =>
        macro.id === id ? { ...macro, name, command, shortcut } : macro
      ),
    })),

  executeMacro: (id) => {
    const macro = get().macros.find((m) => m.id === id);
    if (macro) {
      get().sendData(macro.command);
    }
  },
});
