import {
  IAdvancedFilter,
  IDSOFramingObjectInfo,
  IFavoriteTarget,
  IObservationPlan,
  ISearchHistory,
} from "@/types/skymap";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import log from "@/utils/logger";
import { ITargetGroup, ITargetNote, ITargetStatistics } from "@/types/skymap";

interface TwilightData {
  evening: {
    sun_set_time: Date;
    evening_astro_time: Date;
  };
  morning: {
    sun_rise_time: Date;
    morning_astro_time: Date;
  };
}

interface TargetListState {
  targets: IDSOFramingObjectInfo[];
  focusTargetId: string | null;
  twilight_data: TwilightData;
  addTarget: (target: IDSOFramingObjectInfo) => void;
  setFocusTarget: (id: string) => void;
  addTargetAndFocus: (target: IDSOFramingObjectInfo) => void;
  saveAllTargets: () => void;
  changeFocusTarget: (target: IDSOFramingObjectInfo) => void;
  loading: boolean;
  error: string | null;
  selectAll: () => void;

  removeTarget: (name: string) => void;
  updateTarget: (target: IDSOFramingObjectInfo) => void;
  clearTargets: () => void;
  setLoading: (status: boolean) => void;
  setError: (error: string | null) => void;

  all_tags: string[];
  all_flags: string[];
  setTargetFlag: (params: { index: number; update_string: string }) => void;
  setTargetTag: (params: { index: number; update_string: string }) => void;
  renameTarget: (params: { index: number; update_string: string }) => void;
  checkOneTarget: (index: number) => void;
  clearAllChecked: () => void;
  setTwilightData: (data: TwilightData) => void;
}

interface ExtendedTargetListState extends TargetListState {
  searchHistory: ISearchHistory[];
  favorites: IFavoriteTarget[];
  advancedFilter: IAdvancedFilter;

  addToHistory: (history: ISearchHistory) => void;
  clearHistory: () => void;
  addToFavorites: (target: IFavoriteTarget) => void;
  removeFromFavorites: (id: string) => void;
  updateFavoriteNotes: (id: string, notes: string) => void;
  setAdvancedFilter: (filter: Partial<IAdvancedFilter>) => void;

  groups: ITargetGroup[];
  notes: ITargetNote[];
  statistics: ITargetStatistics;

  // Group management
  addGroup: (
    group: Omit<ITargetGroup, "id" | "createdAt" | "updatedAt">
  ) => void;
  updateGroup: (groupId: string, updates: Partial<ITargetGroup>) => void;
  deleteGroup: (groupId: string) => void;
  addTargetToGroup: (groupId: string, targetName: string) => void;
  removeTargetFromGroup: (groupId: string, targetName: string) => void;

  // Notes management
  addNote: (note: Omit<ITargetNote, "createdAt" | "updatedAt">) => void;
  updateNote: (targetName: string, content: string) => void;
  deleteNote: (targetName: string) => void;

  // Statistics
  updateStatistics: () => void;

  // Batch operations
  importTargets: (targets: IDSOFramingObjectInfo[]) => void;
  batchUpdateTags: (targetNames: string[], tag: string) => void;
  batchUpdateFlags: (targetNames: string[], flag: string) => void;

  // Sorting and filtering
  sortTargets: (by: keyof IDSOFramingObjectInfo, order: "asc" | "desc") => void;
  filterTargets: (filters: {
    type?: string[];
    minSize?: number;
    maxSize?: number;
    minAltitude?: number;
    maxAltitude?: number;
    constellation?: string[];
  }) => void;

  // Batch operations
  batchDelete: (targetIds: string[]) => void;
  batchExport: (targetIds: string[], format: "csv" | "json") => void;
  batchImportFromFile: (file: File) => Promise<void>;

  // Observation plan
  generateObservationPlan: (params: {
    date: Date;
    duration: number;
    minAltitude: number;
    weatherConditions: string[];
  }) => Promise<IObservationPlan>;

  // Extended statistics
  targetStatistics: {
    totalObservationTime: number;
    bestObservingMonths: { [key: string]: number };
    successRate: number;
    averageAltitude: number;
    popularTypes: { [key: string]: number };
  };

  // 视图状态
  viewState: {
    showFovDialog: boolean;
    targetRa: number;
    targetDec: number;
    screenRa: number;
    screenDec: number;
    cameraRotation: number;
    fovData: {
      xPixels: number;
      xPixelSize: number;
      yPixels: number;
      yPixelSize: number;
      focalLength: number;
    };
    showSpan: boolean;
    zoomLevel: number;
    showGrid: boolean;
    showConstellations: boolean;
    nightMode: boolean;
    leftPanelCollapsed: boolean;
    rightPanelCollapsed: boolean;
    showTopTools: boolean;
    fovPoints: [
      [number, number],
      [number, number],
      [number, number],
      [number, number]
    ][];
    fovX: number;
    fovY: number;
    aladinShowFov: number;
  };

  // 视图操作方法
  setViewState: (
    updates: Partial<ExtendedTargetListState["viewState"]>
  ) => void;
  updateScreenPosition: (ra: number, dec: number) => void;
  updateTargetCenter: () => void;
  calculateFovPoints: () => void;
  handleZoom: (direction: "in" | "out") => void;
  togglePanel: (panel: "left" | "right") => void;
  toggleNightMode: () => void;
}

export const useSkymapStore = create<ExtendedTargetListState>()(
  persist(
    (set, get) => ({
      targets: [],
      focusTargetId: null,
      twilight_data: {
        evening: {
          sun_set_time: new Date(),
          evening_astro_time: new Date(),
        },
        morning: {
          sun_rise_time: new Date(),
          morning_astro_time: new Date(),
        },
      },
      selectAll: () =>
        set((state) => {
          const targets = state.targets.map((target) => ({
            ...target,
            checked: true,
          }));
          log.info("All targets selected");
          return { targets };
        }),
      addTarget: (target) =>
        set((state) => {
          log.info(`Adding target: ${target.name}`);
          return {
            targets: [...state.targets, target],
          };
        }),
      setFocusTarget: (id) =>
        set(() => {
          log.info(`Setting focus target to: ${id}`);
          return {
            focusTargetId: id,
          };
        }),
      addTargetAndFocus: (target) =>
        set((state) => {
          log.info(`Adding and focusing on target: ${target.name}`);
          return {
            targets: [...state.targets, target],
            focusTargetId: target.name,
          };
        }),
      saveAllTargets: () => {
        const targets = get().targets;
        localStorage.setItem("targets", JSON.stringify(targets));
        log.info("All targets saved to local storage");
      },
      changeFocusTarget: (target) =>
        set(() => {
          log.info(`Changing focus target to: ${target.name}`);
          return {
            focusTargetId: target.name,
          };
        }),
      loading: false,
      error: null,

      removeTarget: (name) =>
        set((state) => {
          log.info(`Removing target: ${name}`);
          return {
            targets: state.targets.filter((t) => t.name !== name),
          };
        }),

      updateTarget: (target) =>
        set((state) => {
          log.info(`Updating target: ${target.name}`);
          return {
            targets: state.targets.map((t) =>
              t.name === target.name ? target : t
            ),
          };
        }),

      clearTargets: () =>
        set(() => {
          log.info("Clearing all targets");
          return { targets: [], focusTargetId: null };
        }),

      setLoading: (status) =>
        set(() => {
          log.info(`Setting loading status to: ${status}`);
          return { loading: status };
        }),

      setError: (error) =>
        set(() => {
          log.error(`Setting error: ${error}`);
          return { error };
        }),

      all_tags: [],
      all_flags: [],
      setTargetFlag: ({ index, update_string }) =>
        set((state) => {
          const targets = [...state.targets];
          targets[index].flag = update_string;
          log.info(
            `Setting flag for target at index ${index} to: ${update_string}`
          );
          return { targets };
        }),
      setTargetTag: ({ index, update_string }) =>
        set((state) => {
          const targets = [...state.targets];
          targets[index].tag = update_string;
          log.info(
            `Setting tag for target at index ${index} to: ${update_string}`
          );
          return { targets };
        }),
      renameTarget: ({ index, update_string }) =>
        set((state) => {
          const targets = [...state.targets];
          targets[index].name = update_string;
          log.info(`Renaming target at index ${index} to: ${update_string}`);
          return { targets };
        }),
      checkOneTarget: (index) =>
        set((state) => {
          const targets = state.targets.map((target, i) => ({
            ...target,
            checked: i === index,
          }));
          log.info(`Checking target at index ${index}`);
          return { targets };
        }),
      clearAllChecked: () =>
        set((state) => {
          const targets = state.targets.map((target) => ({
            ...target,
            checked: false,
          }));
          log.info("Clearing all checked targets");
          return { targets };
        }),
      setTwilightData: (data) =>
        set(() => {
          log.info("Setting twilight data");
          return {
            twilight_data: data,
          };
        }),

      searchHistory: [],
      favorites: [],
      advancedFilter: {
        angular_size_min: 0,
        angular_size_max: 100,
        magnitude_min: -30,
        magnitude_max: 30,
        type: [],
        constellation: [],
        transit_month: [],
        sort: {
          field: "name",
          order: "asc",
        },
      },

      addToHistory: (history) =>
        set((state) => ({
          searchHistory: [history, ...state.searchHistory].slice(0, 50),
        })),

      clearHistory: () => set(() => ({ searchHistory: [] })),

      addToFavorites: (target) =>
        set((state) => ({
          favorites: [...state.favorites, target],
        })),

      removeFromFavorites: (id) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
        })),

      updateFavoriteNotes: (id, notes) =>
        set((state) => ({
          favorites: state.favorites.map((f) =>
            f.id === id ? { ...f, notes } : f
          ),
        })),

      setAdvancedFilter: (filter) =>
        set((state) => ({
          advancedFilter: { ...state.advancedFilter, ...filter },
        })),

      groups: [],
      notes: [],
      statistics: {
        totalCount: 0,
        typeDistribution: {},
        tagDistribution: {},
        flagDistribution: {},
        averageSize: 0,
        monthlyDistribution: {},
      },

      addGroup: (group) =>
        set((state) => ({
          groups: [
            ...state.groups,
            {
              ...group,
              id: crypto.randomUUID(),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        })),

      addTargetToGroup: (groupId, targetName) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  targets: [...g.targets, targetName],
                  updatedAt: new Date(),
                }
              : g
          ),
        })),

      removeTargetFromGroup: (groupId, targetName) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId
              ? {
                  ...g,
                  targets: g.targets.filter((t) => t !== targetName),
                  updatedAt: new Date(),
                }
              : g
          ),
        })),

      updateGroup: (groupId, updates) =>
        set((state) => ({
          groups: state.groups.map((g) =>
            g.id === groupId ? { ...g, ...updates, updatedAt: new Date() } : g
          ),
        })),

      deleteGroup: (groupId) =>
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== groupId),
        })),

      addNote: (note) =>
        set((state) => ({
          notes: [
            ...state.notes,
            { ...note, createdAt: new Date(), updatedAt: new Date() },
          ],
        })),

      deleteNote: (targetName) =>
        set((state) => ({
          notes: state.notes.filter((n) => n.targetName !== targetName),
        })),

      updateNote: (targetName, content) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.targetName === targetName
              ? { ...n, content, updatedAt: new Date() }
              : n
          ),
        })),

      updateStatistics: () =>
        set((state) => {
          const stats = calculateStatistics(state.targets);
          return { statistics: stats };
        }),

      importTargets: (targets) =>
        set((state) => {
          const existingNames = new Set(state.targets.map((t) => t.name));
          const newTargets = targets.filter((t) => !existingNames.has(t.name));
          return {
            targets: [...state.targets, ...newTargets],
          };
        }),

      batchUpdateTags: (targetNames, tag) =>
        set((state) => ({
          targets: state.targets.map((t) =>
            targetNames.includes(t.name) ? { ...t, tag } : t
          ),
        })),

      batchUpdateFlags: (targetNames, flag) =>
        set((state) => ({
          targets: state.targets.map((t) =>
            targetNames.includes(t.name) ? { ...t, flag } : t
          ),
        })),

      sortTargets: (by, order) =>
        set((state) => {
          const sorted = [...state.targets].sort((a, b) => {
            const aValue = a[by];
            const bValue = b[by];

            if (typeof aValue === "string" && typeof bValue === "string") {
              return order === "asc"
                ? aValue.localeCompare(bValue)
                : bValue.localeCompare(aValue);
            }

            if (typeof aValue === "number" && typeof bValue === "number") {
              return order === "asc" ? aValue - bValue : bValue - aValue;
            }

            return 0;
          });
          return { targets: sorted };
        }),

      filterTargets: (filters) =>
        set((state) => {
          const filtered = state.targets.filter((target) => {
            let match = true;
            if (filters.type) {
              match = match && filters.type.includes(target.target_type);
            }
            if (filters.minSize !== undefined) {
              match = match && target.size >= filters.minSize;
            }
            // ... 更多过滤条件
            return match;
          });
          return { targets: filtered };
        }),

      batchDelete: (targetIds) =>
        set((state) => ({
          targets: state.targets.filter((t) => !targetIds.includes(t.name)),
        })),

      batchExport: (targetIds, format) => {
        const state = get();
        const targets = state.targets.filter((t) => targetIds.includes(t.name));

        if (format === "csv") {
          // 导出为CSV
          const headers = ["name", "type", "ra", "dec", "size"];
          const rows = targets.map((t) =>
            [t.name, t.target_type, t.ra, t.dec, t.size].join(",")
          );
          return [headers.join(","), ...rows].join("\n");
        } else {
          // 导出为JSON
          return JSON.stringify(targets, null, 2);
        }
      },

      batchImportFromFile: async (file) => {
        const text = await file.text();
        let importedTargets: IDSOFramingObjectInfo[] = [];

        if (file.name.endsWith(".csv")) {
          // 处理CSV导入
          const rows = text.split("\n").slice(1); // 跳过表头
          importedTargets = rows.map((row) => {
            const [name, type, ra, dec, size] = row.split(",");
            return {
              name,
              target_type: type,
              ra: parseFloat(ra),
              dec: parseFloat(dec),
              size: parseFloat(size),
              rotation: 0,
              flag: "",
              tag: "",
              checked: false,
            };
          });
        } else {
          // 处理JSON导入
          importedTargets = JSON.parse(text);
        }

        set((state) => ({
          targets: [...state.targets, ...importedTargets],
        }));
      },

      generateObservationPlan: async (params) => {
        // 实现观测计划生成逻辑
        const state = get();
        const targets = state.targets;
        const plan: IObservationPlan = {
          startTime: params.date,
          endTime: new Date(
            params.date.getTime() + params.duration * 60 * 60 * 1000
          ),
          targets: [],
          priority: 1,
          weather: params.weatherConditions.join(","),
        };

        // Sort targets by optimal visibility during the observation window
        const sortedTargets = targets
          .filter((target) => {
            // Calculate target's altitude at the midpoint of observation
            const midTime = new Date(
              params.date.getTime() + params.duration * 30 * 60 * 1000
            );
            const altitude = calculateTargetAltitude(
              target.ra,
              target.dec,
              midTime
            );
            return altitude >= params.minAltitude;
          })
          .sort((a, b) => {
            // Sort by optimal visibility time
            const altitudeA = calculateTargetAltitude(a.ra, a.dec, params.date);
            const altitudeB = calculateTargetAltitude(b.ra, b.dec, params.date);
            return altitudeB - altitudeA;
          });

        // Add suitable targets to the plan
        let currentTime = params.date;
        for (const target of sortedTargets) {
          if (currentTime >= plan.endTime) break;

          // Calculate estimated exposure time based on target brightness and type
          const exposureTime = calculateExposureTime(target);

          const endTime = new Date(currentTime.getTime() + exposureTime * 1000);
          if (endTime <= plan.endTime) {
            plan.targets.push({
              ...target,
              rotation: target.rotation || 0,
              flag: target.flag || "",
              tag: target.tag || "",
              checked: false,
              size: target.size || 0,
              target_type: target.target_type || "",
            });
            currentTime = endTime;
          }
        }

        return plan;
      },

      targetStatistics: {
        totalObservationTime: 0,
        bestObservingMonths: {},
        successRate: 0,
        averageAltitude: 0,
        popularTypes: {},
      },

      viewState: {
        showFovDialog: false,
        targetRa: 0,
        targetDec: 0,
        screenRa: 0,
        screenDec: 0,
        cameraRotation: 0,
        fovData: {
          xPixels: 0,
          xPixelSize: 0,
          yPixels: 0,
          yPixelSize: 0,
          focalLength: 0,
        },
        showSpan: false,
        zoomLevel: 1,
        showGrid: false,
        showConstellations: false,
        nightMode: true,
        leftPanelCollapsed: false,
        rightPanelCollapsed: false,
        showTopTools: true,
        fovPoints: [],
        fovX: 0.25,
        fovY: 0.25,
        aladinShowFov: 0.5,
      },

      setViewState: (updates) =>
        set((state) => ({
          viewState: { ...state.viewState, ...updates },
        })),

      updateScreenPosition: (ra, dec) =>
        set((state) => ({
          viewState: {
            ...state.viewState,
            screenRa: ra,
            screenDec: dec,
          },
        })),

      updateTargetCenter: () =>
        set((state) => ({
          viewState: {
            ...state.viewState,
            targetRa: state.viewState.screenRa,
            targetDec: state.viewState.screenDec,
          },
        })),

      calculateFovPoints: () => {
        const state = get();
        const { fovData, targetRa, targetDec, cameraRotation } =
          state.viewState;

        if (fovData.focalLength === 0) return;

        // Calculate FOV dimensions in degrees
        const xFov =
          (((fovData.xPixels * fovData.xPixelSize) /
            (fovData.focalLength * 3600)) *
            180) /
          Math.PI;
        const yFov =
          (((fovData.yPixels * fovData.yPixelSize) /
            (fovData.focalLength * 3600)) *
            180) /
          Math.PI;

        // Calculate corner points
        const halfX = xFov / 2;
        const halfY = yFov / 2;
        const rotRad = (cameraRotation * Math.PI) / 180;

        // Define corner points with explicit typing
        type Corner = [number, number];
        type Corners = [Corner, Corner, Corner, Corner];

        const corners: Corners = [
          [-halfX, -halfY],
          [halfX, -halfY],
          [halfX, halfY],
          [-halfX, halfY],
        ].map(([x, y]): Corner => {
          // Rotate point
          const rotX = x * Math.cos(rotRad) - y * Math.sin(rotRad);
          const rotY = x * Math.sin(rotRad) + y * Math.cos(rotRad);

          // Convert to RA/Dec
          const dec = targetDec + rotY;
          const ra = targetRa + rotX / Math.cos((dec * Math.PI) / 180);

          return [ra, dec];
        }) as Corners;

        // Return array of corner arrays to match the interface definition
        set((state) => ({
          viewState: {
            ...state.viewState,
            fovPoints: [corners], // Now correctly returns array of corner arrays
          },
        }));
      },

      handleZoom: (direction) =>
        set((state) => {
          const newZoom =
            direction === "in"
              ? Math.min(state.viewState.zoomLevel * 1.2, 5)
              : Math.max(state.viewState.zoomLevel / 1.2, 0.2);

          return {
            viewState: {
              ...state.viewState,
              zoomLevel: newZoom,
              aladinShowFov: state.viewState.aladinShowFov / newZoom,
            },
          };
        }),

      togglePanel: (panel) =>
        set((state) => ({
          viewState: {
            ...state.viewState,
            [panel === "left" ? "leftPanelCollapsed" : "rightPanelCollapsed"]:
              !state.viewState[
                panel === "left" ? "leftPanelCollapsed" : "rightPanelCollapsed"
              ],
          },
        })),

      toggleNightMode: () =>
        set((state) => ({
          viewState: {
            ...state.viewState,
            nightMode: !state.viewState.nightMode,
          },
        })),
    }),
    {
      name: "target-storage",
      partialize: (state) => ({
        targets: state.targets,
        searchHistory: state.searchHistory,
        favorites: state.favorites,
        advancedFilter: state.advancedFilter,
        groups: state.groups,
        notes: state.notes,
        targetStatistics: state.targetStatistics,
        viewState: state.viewState,
      }),
    }
  )
);

function calculateTargetAltitude(ra: number, dec: number, date: Date): number {
  // Convert observer's coordinates (example: using a default location)
  const OBSERVER_LAT = 35.0; // Default latitude in degrees
  const OBSERVER_LON = -120.0; // Default longitude in degrees

  // Calculate Local Sidereal Time (LST)
  const UTC = date.getUTCHours() + date.getUTCMinutes() / 60;
  const JD = date.getTime() / 86400000 + 2440587.5;
  const LST =
    (100.46 + 0.985647 * (JD - 2451545.0) + OBSERVER_LON + 15 * UTC) % 360;

  // Convert RA to hour angle (HA)
  const HA = LST - ra;

  // Convert degrees to radians for trigonometric calculations
  const lat = (OBSERVER_LAT * Math.PI) / 180;
  const ha = (HA * Math.PI) / 180;
  const declination = (dec * Math.PI) / 180;

  // Calculate altitude using the formula:
  // sin(alt) = sin(lat)sin(dec) + cos(lat)cos(dec)cos(ha)
  const altitude = Math.asin(
    Math.sin(lat) * Math.sin(declination) +
      Math.cos(lat) * Math.cos(declination) * Math.cos(ha)
  );

  // Convert altitude from radians to degrees
  return (altitude * 180) / Math.PI;
}

function calculateExposureTime(target: IDSOFramingObjectInfo): number {
  // Default exposure times (in seconds) based on target type
  const defaultExposures: { [key: string]: number } = {
    galaxy: 300,
    nebula: 240,
    cluster: 180,
    star: 120,
    default: 180,
  };

  return (
    defaultExposures[target.target_type?.toLowerCase()] ||
    defaultExposures["default"]
  );
}

function calculateStatistics(
  targets: IDSOFramingObjectInfo[]
): ITargetStatistics {
  const statistics: ITargetStatistics = {
    totalCount: targets.length,
    typeDistribution: {},
    tagDistribution: {},
    flagDistribution: {},
    averageSize: 0,
    monthlyDistribution: {},
  };

  if (targets.length === 0) {
    return statistics;
  }

  // Calculate type distribution
  targets.forEach((target) => {
    if (target.target_type) {
      statistics.typeDistribution[target.target_type] =
        (statistics.typeDistribution[target.target_type] || 0) + 1;
    }
  });

  // Calculate tag distribution
  targets.forEach((target) => {
    if (target.tag) {
      statistics.tagDistribution[target.tag] =
        (statistics.tagDistribution[target.tag] || 0) + 1;
    }
  });

  // Calculate flag distribution
  targets.forEach((target) => {
    if (target.flag) {
      statistics.flagDistribution[target.flag] =
        (statistics.flagDistribution[target.flag] || 0) + 1;
    }
  });

  // Calculate average size
  const totalSize = targets.reduce(
    (sum, target) => sum + (target.size || 0),
    0
  );
  statistics.averageSize = totalSize / targets.length;

  // Calculate monthly distribution (based on RA)
  targets.forEach((target) => {
    // Convert RA to approximate month (rough estimation)
    const month = (Math.floor(target.ra / 15 + 6) % 12) + 1;
    statistics.monthlyDistribution[month] =
      (statistics.monthlyDistribution[month] || 0) + 1;
  });

  return statistics;
}
