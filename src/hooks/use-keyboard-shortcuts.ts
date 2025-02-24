import { useEffect } from 'react';

interface ShortcutHandlers {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
  onCapture: () => void;
  onToggleGrid: () => void;
  onToggleSettings: () => void;
  onReset: () => void;
}

export function useKeyboardShortcuts({
  onZoomIn,
  onZoomOut,
  onRotate,
  onCapture,
  onToggleGrid,
  onToggleSettings,
  onReset,
}: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case '=':
        case '+':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onZoomIn();
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onZoomOut();
          }
          break;
        case 'r':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onRotate();
          }
          break;
        case ' ':
          e.preventDefault();
          onCapture();
          break;
        case 'g':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onToggleGrid();
          }
          break;
        case ',':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onToggleSettings();
          }
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            onReset();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onZoomIn,
    onZoomOut,
    onRotate,
    onCapture,
    onToggleGrid,
    onToggleSettings,
    onReset,
  ]);
}
