import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type ThemeName = 'radar' | 'swiss';

interface ThemeState {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'swiss', // Default theme
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'researcher-theme', // localStorage key
      storage: createJSONStorage(() => localStorage),
    }
  )
);
