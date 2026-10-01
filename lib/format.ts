/** DB DATETIME strings ("YYYY-MM-DD HH:MM:SS") are UTC. */
export function parseDbDateTime(s: string): Date {
  return new Date(s.replace(" ", "T") + "Z");
}
export const toIso = (s: string) => parseDbDateTime(s).toISOString();

/** Format a DATE column ("YYYY-MM-DD") without any timezone shifting. */
export function formatDate(s: string | null | undefined): string {
  if (!s) return "";
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { dateStyle: "medium" });
}
