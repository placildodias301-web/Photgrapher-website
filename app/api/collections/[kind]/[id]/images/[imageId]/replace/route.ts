import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { bad, ok, unauthorized } from "@/lib/api";
import { isKind, replaceImage } from "@/lib/collections";

export async function POST(req: NextRequest, { params }: { params: Promise<{ kind: string; id: string; imageId: string }> }) {
  const { kind, id, imageId } = await params;
  if (!isKind(kind)) return bad("Unknown type.", 404);
  if (!(await getSessionUser())) return unauthorized();
  const file = (await req.formData()).get("file");
  if (!(file instanceof File)) return bad("Choose a photo.");
  try {
    const r = await replaceImage(kind, Number(id), Number(imageId), file);
    if (r === "notfound") return bad("Photo not found.", 404);
    return r ? bad(r) : ok();
  } catch (e) { console.error(e); return bad("Upload failed. Please try again.", 500); }
}
