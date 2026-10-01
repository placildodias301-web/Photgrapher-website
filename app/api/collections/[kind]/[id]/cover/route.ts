import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { bad, ok, unauthorized } from "@/lib/api";
import { isKind, setCoverFile, setCoverFromImage } from "@/lib/collections";

type P = { params: Promise<{ kind: string; id: string }> };

// Upload a new cover image.
export async function POST(req: NextRequest, { params }: P) {
  const { kind, id } = await params;
  if (!isKind(kind)) return bad("Unknown type.", 404);
  if (!(await getSessionUser())) return unauthorized();
  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) return bad("Choose an image.");
  try {
    const err = await setCoverFile(kind, Number(id), file);
    return err ? bad(err) : ok();
  } catch (e) { console.error(e); return bad("Upload failed. Please try again.", 500); }
}

// Use an existing gallery photo as the cover.
export async function PUT(req: NextRequest, { params }: P) {
  const { kind, id } = await params;
  if (!isKind(kind)) return bad("Unknown type.", 404);
  if (!(await getSessionUser())) return unauthorized();
  const parsed = z.object({ imageId: z.number().int() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Invalid request.");
  return (await setCoverFromImage(kind, Number(id), parsed.data.imageId)) ? ok() : bad("Photo not found.", 404);
}
