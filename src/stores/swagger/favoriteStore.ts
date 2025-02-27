import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FavoriteEndpoint {
  id: string;
  path: string;
  method: string;
  summary: string;
  tags: string[];
}

interface FavoritesState {
  favorites: FavoriteEndpoint[];
  addFavorite: (endpoint: FavoriteEndpoint) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (endpoint) => {
        set((state) => ({
          favorites: [...state.favorites, endpoint],
        }));
      },

      removeFavorite: (id) => {
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
        }));
      },

      isFavorite: (id) => {
        return get().favorites.some((f) => f.id === id);
      },
    }),
    {
      name: "swagger-favorites",
    }
  )
);
