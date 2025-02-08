import log from "@/utils/logger";
import { create } from "zustand";

interface ImageData {
  id?: number;
  url: string;
  name?: string;
  timestamp?: number;
  size?: number;
}

interface IndexedDBState {
  db: IDBDatabase | null;
  isDBOpen: boolean;
  dbVersion: number;
  storeNames: string[];
  // 打开数据库，可传入自定义的 store 名称数组
  openDB: (customStoreNames?: string[]) => void;
  // 确保对象仓库存在（如果不存在，需要数据库版本升级才能创建）
  ensureStore: (storeName: string) => void;
  addImage: (image: ImageData, storeName: string) => void;
  getAllImages: (storeName: string) => Promise<ImageData[]>;
  deleteImage: (id: number, storeName: string) => void;
  clearDB: () => void;
  searchImages: (query: string, storeName: string) => Promise<ImageData[]>;
  bulkAddImages: (images: ImageData[], storeName: string) => void;
  bulkDeleteImages: (ids: number[], storeName: string) => void;
  getImageCount: (storeName: string) => Promise<number>;
  updateImage: (id: number, image: ImageData, storeName: string) => void;
  getImageById: (
    id: number,
    storeName: string
  ) => Promise<ImageData | undefined>;
  closeDB: () => void;
  // 执行数据库版本升级，可传入新的 store 名称数组（如果要新增存储对象）
  upgradeDB: (newVersion: number, customStoreNames?: string[]) => void;
}

export const useIndexedDBStore = create<IndexedDBState>((set, get) => ({
  db: null,
  isDBOpen: false,
  dbVersion: 1,
  // 默认两个对象仓库，可根据需要扩展
  storeNames: ["landscape", "portrait"],

  openDB: (customStoreNames) => {
    if (customStoreNames) {
      set({ storeNames: customStoreNames });
    }
    try {
      log.info("Attempting to open IndexedDB...");
      const { dbVersion, storeNames } = get();
      const request = indexedDB.open("myDB", dbVersion);

      request.onerror = (event) => {
        log.error("Error opening database:", event);
        set({ isDBOpen: false });
      };

      request.onsuccess = () => {
        log.info("Database opened successfully:", request.result);
        set({ db: request.result, isDBOpen: true });
      };

      request.onupgradeneeded = (event) => {
        log.info("Database upgrade needed...");
        const target = event.target as IDBOpenDBRequest;
        if (!target) {
          log.error("Error: event.target is null");
          return;
        }
        const db = target.result;
        storeNames.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, {
              keyPath: "id",
              autoIncrement: true,
            });
            log.info(`Created object store: ${storeName}`);
          }
        });
      };
    } catch (error) {
      log.error("Error opening database:", error);
      set({ isDBOpen: false });
    }
  },

  ensureStore: (storeName) => {
    const { db } = get();
    if (!db) {
      log.warn("Database not open, cannot ensure store.");
      return;
    }
    if (!db.objectStoreNames.contains(storeName)) {
      // IndexedDB 中已打开的数据库无法动态新增对象仓库，
      // 如需新增请调用 upgradeDB 进行版本升级。
      log.warn(
        `Store "${storeName}" does not exist. Please use upgradeDB to add it.`
      );
    }
  },

  addImage: async (image, storeName) => {
    const { db, openDB } = get();
    if (!db) {
      log.warn("Database not open, attempting to open...");
      openDB();
      return;
    }
    log.info(`Adding image to "${storeName}" store...`);
    const transaction = db.transaction([storeName], "readwrite");
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.add(image);

    request.onsuccess = () => {
      log.info("Image added successfully:", image);
    };

    request.onerror = (event) => {
      log.error("Error adding image:", event);
    };
  },

  getAllImages: (storeName) => {
    const { db } = get();
    return new Promise<ImageData[]>((resolve, reject) => {
      if (!db) {
        log.error("Database is not open");
        reject("Database is not open");
        return;
      }
      log.info(`Fetching all images from "${storeName}" store...`);
      const transaction = db.transaction([storeName], "readonly");
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        log.info(`Successfully fetched images from "${storeName}" store`);
        resolve(request.result as ImageData[]);
      };

      request.onerror = (event) => {
        log.error("Error fetching images:", event);
        reject(event);
      };
    });
  },

  deleteImage: (id, storeName) => {
    const { db, openDB } = get();
    if (!db) {
      log.warn("Database not open, attempting to open...");
      openDB();
      return;
    }
    log.info(`Deleting image with ID ${id} from "${storeName}" store...`);
    const transaction = db.transaction([storeName], "readwrite");
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.delete(id);

    request.onsuccess = () => {
      log.info("Image deleted successfully:", id);
    };

    request.onerror = (event) => {
      log.error("Error deleting image:", event);
    };
  },

  clearDB: () => {
    const { db, openDB, storeNames } = get();
    if (!db) {
      log.warn("Database not open, attempting to open...");
      openDB();
      return;
    }
    log.info("Clearing all images from all stores...");
    const transaction = db.transaction(storeNames, "readwrite");
    storeNames.forEach((storeName) => {
      const objectStore = transaction.objectStore(storeName);
      objectStore.clear();
    });
    log.info("Database cleared successfully.");
  },

  searchImages: (query, storeName) => {
    const { db } = get();
    return new Promise<ImageData[]>((resolve, reject) => {
      if (!db) {
        log.error("Database is not open");
        reject("Database is not open");
        return;
      }
      log.info(`Searching images in "${storeName}" store with query: ${query}`);
      const transaction = db.transaction([storeName], "readonly");
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        const results = (request.result as ImageData[]).filter((img) =>
          img.name?.toLowerCase().includes(query.toLowerCase())
        );
        log.info(`Found ${results.length} images matching the query`);
        resolve(results);
      };
      request.onerror = (event) => {
        log.error("Error searching images:", event);
        reject(event);
      };
    });
  },

  bulkAddImages: (images, storeName) => {
    const { db, openDB } = get();
    if (!db) {
      log.warn("Database not open, attempting to open...");
      openDB();
      return;
    }
    log.info(`Bulk adding ${images.length} images to "${storeName}" store...`);
    const transaction = db.transaction([storeName], "readwrite");
    const objectStore = transaction.objectStore(storeName);

    images.forEach((image) => {
      const request = objectStore.add({
        ...image,
        timestamp: Date.now(),
      });
      request.onerror = (event) => log.error("Error bulk adding image:", event);
    });
    log.info("Bulk add operation completed.");
  },

  bulkDeleteImages: (ids, storeName) => {
    const { db, openDB } = get();
    if (!db) {
      log.warn("Database not open, attempting to open...");
      openDB();
      return;
    }
    log.info(`Bulk deleting ${ids.length} images from "${storeName}" store...`);
    const transaction = db.transaction([storeName], "readwrite");
    const objectStore = transaction.objectStore(storeName);

    ids.forEach((id) => {
      const request = objectStore.delete(id);
      request.onerror = (event) =>
        log.error("Error bulk deleting image:", event);
    });
    log.info("Bulk delete operation completed.");
  },

  getImageCount: (storeName) => {
    const { db } = get();
    return new Promise<number>((resolve, reject) => {
      if (!db) {
        log.error("Database is not open");
        reject("Database is not open");
        return;
      }
      log.info(`Getting image count from "${storeName}" store...`);
      const transaction = db.transaction([storeName], "readonly");
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.count();

      request.onsuccess = () => {
        log.info(`Image count in "${storeName}" store: ${request.result}`);
        resolve(request.result);
      };
      request.onerror = (event) => {
        log.error("Error getting image count:", event);
        reject(event);
      };
    });
  },

  updateImage: (id, image, storeName) => {
    const { db, openDB } = get();
    if (!db) {
      log.warn("Database not open, attempting to open...");
      openDB();
      return;
    }
    log.info(`Updating image with ID ${id} in "${storeName}" store...`);
    const transaction = db.transaction([storeName], "readwrite");
    const objectStore = transaction.objectStore(storeName);
    const request = objectStore.put({ ...image, id });

    request.onsuccess = () => {
      log.info("Image updated successfully:", id);
    };

    request.onerror = (event) => {
      log.error("Error updating image:", event);
    };
  },

  getImageById: (id, storeName) => {
    const { db } = get();
    return new Promise<ImageData | undefined>((resolve, reject) => {
      if (!db) {
        log.error("Database is not open");
        reject("Database is not open");
        return;
      }
      log.info(`Fetching image with ID ${id} from "${storeName}" store...`);
      const transaction = db.transaction([storeName], "readonly");
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.get(id);

      request.onsuccess = () => {
        log.info(`Image fetched successfully from "${storeName}" store`);
        resolve(request.result as ImageData | undefined);
      };

      request.onerror = (event) => {
        log.error("Error fetching image:", event);
        reject(event);
      };
    });
  },

  closeDB: () => {
    const { db } = get();
    if (db) {
      log.info("Closing database...");
      db.close();
      set({ db: null, isDBOpen: false });
    }
  },

  upgradeDB: (newVersion, customStoreNames) => {
    const { dbVersion, openDB, closeDB } = get();
    if (newVersion <= dbVersion) {
      log.warn("New version must be greater than current version.");
      return;
    }
    closeDB();
    set({ dbVersion: newVersion });
    if (customStoreNames) {
      set({ storeNames: customStoreNames });
    }
    openDB();
  },
}));
