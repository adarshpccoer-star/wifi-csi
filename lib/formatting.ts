export function formatTimestamp(isoString?: string | null): string {
  if (!isoString) return "--:--:--";
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", { hour12: false });
}

export function formatDuration(startedAt?: string | null): string {
  if (!startedAt) return "00:00:00";
  const diff = Math.max(
    0,
    Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
  );
  const hrs = Math.floor(diff / 3600)
    .toString()
    .padStart(2, "0");
  const mins = Math.floor((diff % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const secs = (diff % 60).toString().padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
}

export function formatPercent(val?: number): string {
  if (val === undefined || val === null) return "0%";
  return `${Math.round(val * 100)}%`;
}
