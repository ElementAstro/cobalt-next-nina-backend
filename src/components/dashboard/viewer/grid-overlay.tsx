import { useMemo } from "react";

interface GridOverlayProps {
  type: string;
  color?: string;
  opacity?: number;
  customDivisions?: number;
}

export function GridOverlay({
  type,
  color = "white",
  opacity = 0.2,
  customDivisions = 3,
}: GridOverlayProps) {
  const gridStyle = useMemo(
    () => ({
      borderColor: color,
      opacity,
    }),
    [color, opacity]
  );

  const renderGrid = () => {
    switch (type) {
      case "rule-of-thirds":
        return (
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
            {Array(4)
              .fill(null)
              .map((_, i) => (
                <div
                  key={i}
                  className={`bg-white/20 ${i < 2 ? "border-r" : "border-b"}`}
                />
              ))}
          </div>
        );
      case "golden-ratio":
        return (
          <div className="absolute inset-0">
            <div
              className="w-full h-full border-[1px] border-white/20"
              style={{ borderWidth: "38.2%" }}
            />
            <div
              className="w-full h-full border-[1px] border-white/20"
              style={{ borderWidth: "61.8%" }}
            />
          </div>
        );
      case "square":
        return (
          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${customDivisions}, 1fr)`,
              gridTemplateRows: `repeat(${customDivisions}, 1fr)`,
            }}
          >
            {Array(customDivisions * customDivisions)
              .fill(null)
              .map((_, i) => (
                <div key={i} className="border" style={gridStyle} />
              ))}
          </div>
        );
      case "diagonal":
        return (
          <svg
            className="absolute inset-0 w-full h-full stroke-current"
            style={gridStyle}
          >
            <line x1="0" y1="0" x2="100%" y2="100%" />
            <line x1="100%" y1="0" x2="0" y2="100%" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">{renderGrid()}</div>
  );
}
