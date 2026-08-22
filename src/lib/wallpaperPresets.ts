export interface WallpaperPreset {
  id: string;
  label: string;
  /** Valor CSS `background` (gradientes) — no dependen de archivos de imagen. */
  css: string;
}

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  { id: 'default', label: 'ERLC HUB', css: 'radial-gradient(circle at 30% 20%, #1e3a8a 0%, #0a0a12 55%), radial-gradient(circle at 80% 80%, #4c1d95 0%, transparent 50%)' },
  { id: 'midnight', label: 'Medianoche', css: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 60%, #000000 100%)' },
  { id: 'sunset', label: 'Atardecer LS', css: 'linear-gradient(160deg, #7c2d12 0%, #831843 50%, #1e1b4b 100%)' },
  { id: 'emerald', label: 'Esmeralda', css: 'linear-gradient(160deg, #064e3b 0%, #0f172a 65%, #000000 100%)' },
];

export function wallpaperPresetById(id: string): WallpaperPreset {
  return WALLPAPER_PRESETS.find(p => p.id === id) || WALLPAPER_PRESETS[0];
}
