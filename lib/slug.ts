import { queryOne } from "@/lib/db";

export function slugify(input: string): string {
  return (
    input.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "untitled"
  );
}

/** A slug that isn't taken in `table` (table name is never user input). */
export async function uniqueSlug(table: "shoots" | "albums" | "videos" | "categories" | "custom_pages", base: string): Promise<string> {
  const root = slugify(base);
  let candidate = root;
  for (let i = 2; i < 500; i++) {
    const hit = await queryOne(`SELECT id FROM \`${table}\` WHERE slug = ?`, [candidate]);
    if (!hit) return candidate;
    candidate = `${root}-${i}`;
  }
  return `${root}-${Date.now()}`;
}
