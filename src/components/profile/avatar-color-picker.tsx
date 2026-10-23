"use client";

import { Check } from "lucide-react";

import { AVATAR_COLORS, profileMessages } from "@/lib/profile/messages";
import { cn } from "@/lib/utils";

interface AvatarColorPickerProps {
  value: string;
  onChange: (next: string) => void;
  name?: string;
}

export function AvatarColorPicker({
  value,
  onChange,
  name = "avatarColor",
}: AvatarColorPickerProps) {
  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-medium text-[var(--foreground)]">
        {profileMessages.edit.avatarLabel}
      </legend>
      <input type="hidden" name={name} value={value} />
      <div
        role="radiogroup"
        aria-label={profileMessages.edit.avatarLabel}
        className="flex flex-wrap gap-2"
      >
        {AVATAR_COLORS.map((color) => {
          const isSelected = color.value === value;
          return (
            <button
              key={color.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={color.label}
              title={color.label}
              onClick={() => onChange(color.value)}
              className={cn(
                "grid size-12 place-items-center rounded-full border-2 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-teal)]",
                isSelected
                  ? "border-[var(--foreground)] shadow-[0_0_0_3px_rgba(231,189,84,0.45)]"
                  : "border-transparent hover:border-white/40",
              )}
              style={{
                background: `linear-gradient(135deg, color-mix(in srgb, ${color.value} 65%, white), ${color.value})`,
              }}
            >
              {isSelected ? (
                <Check
                  className="size-5 text-[#0a1411] drop-shadow"
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="text-xs leading-5 text-[var(--muted-foreground)]">
        {profileMessages.edit.avatarHint}
      </p>
    </fieldset>
  );
}
