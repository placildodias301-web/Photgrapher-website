"use client";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Renders an ISO timestamp in the viewer's own timezone (blank during server render). */
export default function LocalTime({ iso, relative = false }: { iso: string; relative?: boolean }) {
  const text = useSyncExternalStore(subscribe, () => format(iso, relative), () => "");
  return <time dateTime={iso} suppressHydrationWarning>{text}</time>;
}

export function format(iso: string, relative: boolean): string {
  const d = new Date(iso);
  if (relative) {
    const s = Math.round((Date.now() - d.getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return `${Math.floor(s / 60)} min ago`;
    if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
    if (s < 86400 * 7) return `${Math.floor(s / 86400)} d ago`;
  }
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}
