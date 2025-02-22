export type ThemeMode = 'light' | 'dark' | 'system';
export type ColorMode = 'light' | 'dark';

export interface ThemeConfig {
  mode: ThemeMode;
  color?: string;
  radius?: number;
  font?: string;
}