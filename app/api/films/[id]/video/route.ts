import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { bad, ok, unauthorized } from "@/lib/api";
import { replaceFilmMedia } from "@/lib/films";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return unauthorized();
  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) return bad("Choose a file.");
  try {
    const r = await replaceFilmMedia(Number((await params).id), "video", file);
    if (r === "notfound") return bad("Film not found.", 404);
    return r ? bad(r) : ok();
  } catch (e) { console.error(e); return bad("Upload failed. Please try again.", 500); }
}
