import * as React from "react";

import { cn } from "@/lib/utils";

interface AvatarProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color"> {
  name: string;
  src?: string;
  color?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
};

function initialsFor(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function backgroundFor(color: string | null | undefined): string {
  if (!color) return "linear-gradient(135deg,#e7bd54,#1fb6a6)";
  return `linear-gradient(135deg, color-mix(in srgb, ${color} 65%, white), ${color})`;
}

export function Avatar({
  name,
  src,
  color,
  size = "md",
  className,
  style,
  ...props
}: AvatarProps) {
  const initials = initialsFor(name) || "LS";

  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-full border border-white/15 font-bold text-[#0a1411] shadow-[0_10px_28px_rgba(0,0,0,0.26)]",
        sizeClasses[size],
        className,
      )}
      style={{ background: backgroundFor(color), ...style }}
      aria-label={`${name} avatar`}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <span aria-hidden>{initials}</span>
      )}
    </div>
  );
}
