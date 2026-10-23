import { flagIconCode } from "@/lib/teams/flag-codes";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const sizeClasses: Record<Size, string> = {
  sm: "w-5 h-[14px] text-xs",
  md: "w-7 h-5 text-sm",
  lg: "w-9 h-[26px] text-base",
};

interface TeamFlagProps {
  teamCode: string;
  teamName?: string;
  size?: Size;
  className?: string;
}

/**
 * Renders the country flag as an SVG via the `flag-icons` package so it looks
 * identical across Windows, macOS, iOS, Android and Linux. Falls back to the
 * 3-letter team code in a small chip when no mapping is known.
 */
export function TeamFlag({
  teamCode,
  teamName,
  size = "md",
  className,
}: TeamFlagProps) {
  const iso = flagIconCode(teamCode);
  const label = teamName ?? teamCode;
  const baseClasses =
    "inline-block shrink-0 overflow-hidden rounded-[3px] border border-white/15 bg-white/[0.04] align-middle leading-none";

  if (!iso) {
    return (
      <span
        role="img"
        aria-label={`Bandera de ${label}`}
        className={cn(
          baseClasses,
          "grid place-items-center font-mono font-semibold tracking-wider text-[var(--muted-foreground)]",
          sizeClasses[size],
          className,
        )}
      >
        {teamCode.slice(0, 3).toUpperCase()}
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label={`Bandera de ${label}`}
      className={cn(
        baseClasses,
        `fi fi-${iso} fis`,
        sizeClasses[size],
        className,
      )}
    />
  );
}
