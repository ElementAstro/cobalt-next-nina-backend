interface FocusPointProps {
  x: number;
  y: number;
}

export function FocusPoint({ x, y }: FocusPointProps) {
  return (
    <div
      className="absolute w-4 h-4 border-2 border-red-500 rounded-full"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
      }}
    />
  );
}
