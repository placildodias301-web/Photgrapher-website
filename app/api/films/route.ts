import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { bad, unauthorized } from "@/lib/api";
import { createFilm, filmSchema, listFilms } from "@/lib/films";

export async function GET() {
  if (!(await getSessionUser())) return unauthorized();
  return NextResponse.json({ items: await listFilms() });
}

export async function POST(req: NextRequest) {
  if (!(await getSessionUser())) return unauthorized();
  const fd = await req.formData();
  const s = (k: string) => (typeof fd.get(k) === "string" ? (fd.get(k) as string) : "");
  const parsed = filmSchema.safeParse({ title: s("title"), category: s("category") || null, description: s("description") || null, location: s("location") || null, event_date: s("event_date"), featured: s("featured") === "true", published: s("published") === "true" });
  if (!parsed.success) return bad(parsed.error.issues[0].message);
  const video = fd.get("video"), thumb = fd.get("thumbnail");
  if (!(video instanceof File) || !video.size) return bad("Please choose a video file.");
  const r = await createFilm(parsed.data, video, thumb instanceof File && thumb.size ? thumb : null);
  return "error" in r ? bad(r.error) : NextResponse.json({ ok: true, id: r.id });
}
