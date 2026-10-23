"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;
function useIsClient(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

type DateStyle = "short" | "long";

interface LocalDateTimeProps {
  /** ISO 8601 string (e.g. "2026-06-11T16:00:00.000Z"). */
  iso: string;
  /**
   * "short" -> "Jue 11 jun · 14:00"
   * "long"  -> "Jueves, 11 de junio · 14:00"
   */
  style?: DateStyle;
  /** When true, capitalize the first letter of the date label. Default true. */
  capitalize?: boolean;
  /** Defaults to "es-MX". */
  locale?: string;
  /** Defaults to " · ". */
  separator?: string;
  className?: string;
}

const styleOptions: Record<
  DateStyle,
  { date: Intl.DateTimeFormatOptions; time: Intl.DateTimeFormatOptions }
> = {
  short: {
    date: { weekday: "short", day: "numeric", month: "short" },
    time: { hour: "2-digit", minute: "2-digit", hour12: false },
  },
  long: {
    date: { weekday: "long", day: "numeric", month: "long" },
    time: { hour: "2-digit", minute: "2-digit", hour12: false },
  },
};

function capitalizeFirst(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function format(
  iso: string,
  locale: string,
  style: DateStyle,
  separator: string,
  capitalize: boolean,
  timeZone: string | undefined,
): string {
  const date = new Date(iso);
  const { date: dateOpts, time: timeOpts } = styleOptions[style];
  const dateLabel = new Intl.DateTimeFormat(locale, {
    ...dateOpts,
    ...(timeZone ? { timeZone } : {}),
  }).format(date);
  const timeLabel = new Intl.DateTimeFormat(locale, {
    ...timeOpts,
    ...(timeZone ? { timeZone } : {}),
  }).format(date);
  const datePart = capitalize ? capitalizeFirst(dateLabel) : dateLabel;
  const timeSuffix = timeZone === "UTC" ? `${timeLabel} UTC` : timeLabel;
  return `${datePart}${separator}${timeSuffix}`;
}

/**
 * Renders an ISO timestamp formatted in the viewer's local timezone.
 * Server output uses UTC (with "UTC" suffix) to keep SSR deterministic;
 * the client swaps in the local timezone after mount.
 */
export function LocalDateTime({
  iso,
  style = "short",
  capitalize = true,
  locale = "es-MX",
  separator = " · ",
  className,
}: LocalDateTimeProps) {
  const isClient = useIsClient();
  const text = format(
    iso,
    locale,
    style,
    separator,
    capitalize,
    isClient ? undefined : "UTC",
  );

  return (
    <span className={className} suppressHydrationWarning>
      {text}
    </span>
  );
}
