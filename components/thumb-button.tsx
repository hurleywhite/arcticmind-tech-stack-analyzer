"use client";

export default function ThumbButton({
  type,
  active,
  onClick,
}: {
  type: "up" | "down";
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`rounded-full px-2 py-1 text-xs transition-all ${
        active
          ? type === "up"
            ? "bg-green-500/15 text-green-400"
            : "bg-red-500/15 text-red-400"
          : "text-foreground/25 hover:text-foreground/50 hover:bg-foreground/5"
      }`}
      title={type === "up" ? "Useful" : "Not useful"}
    >
      {type === "up" ? "\ud83d\udc4d" : "\ud83d\udc4e"}
    </button>
  );
}
