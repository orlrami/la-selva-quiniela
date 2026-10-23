import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, id, label, error, hint, type = "text", ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="grid gap-2">
        {label ? (
          <label htmlFor={inputId} className="text-sm font-medium text-[var(--foreground)]">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          type={type}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={cn(hintId, errorId) || undefined}
          className={cn(
            "min-h-12 rounded-lg border border-white/12 bg-[#081411]/80 px-4 text-base text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted-foreground)]/70 focus:border-[var(--accent-teal)] focus:ring-4 focus:ring-[var(--accent-teal)]/15 disabled:cursor-not-allowed disabled:opacity-55",
            error && "border-[var(--accent-danger)] focus:border-[var(--accent-danger)] focus:ring-[var(--accent-danger)]/15",
            className,
          )}
          {...props}
        />
        {hint ? (
          <p id={hintId} className="text-xs leading-5 text-[var(--muted-foreground)]">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} role="alert" className="text-xs leading-5 text-[var(--accent-danger)]">
            {error}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
