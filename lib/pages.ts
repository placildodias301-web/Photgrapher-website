import { z } from "zod";
import { exec, queryOne } from "@/lib/db";
import { uniqueSlug } from "@/lib/slug";

// Reserved so a custom page can never shadow a real route or create a confusing URL.
export const RESERVED_SLUGS = new Set([
  "portfolio", "stories", "films", "about", "services", "contact",
  "login", "logout", "dashboard", "forgot-password", "reset-password",
  "api", "uploads", "sitemap.xml", "robots.txt", "favicon.ico",
]);

export const pageSchema = z.object({
  title: z.string().trim().min(1, "Give the page a title.").max(150),
  content: z.string().trim().max(20000).nullable().optional(),
  published: z.boolean().optional(),
});
export type PageInput = z.infer<typeof pageSchema>;

type CreatePageResult = { ok: true; id: number; slug: string } | { ok: false; error: string };

export async function createPage(input: PageInput): Promise<CreatePageResult> {
  const base = input.title.toLowerCase().trim();
  if (RESERVED_SLUGS.has(base.replace(/\s+/g, "-"))) {
    return { ok: false, error: `"${input.title}" is already used by a built-in page. Please choose a different title.` };
  }
  const slug = await uniqueSlug("custom_pages", input.title);
  const res = await exec(`INSERT INTO custom_pages (title, slug, content, published) VALUES (?, ?, ?, ?)`,
    [input.title, slug, input.content || null, !!input.published]);
  return { ok: true, id: res.insertId, slug };
}

export async function updatePage(id: number, input: PageInput) {
  const row = await queryOne(`SELECT id FROM custom_pages WHERE id = ?`, [id]);
  if (!row) return false;
  await exec(`UPDATE custom_pages SET title = ?, content = ?, published = ? WHERE id = ?`,
    [input.title, input.content || null, !!input.published, id]);
  return true;
}
