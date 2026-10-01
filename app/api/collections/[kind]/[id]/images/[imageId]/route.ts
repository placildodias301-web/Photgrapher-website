import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { bad, ok, unauthorized } from "@/lib/api";
import { isKind, removeImage, updateImageAlt } from "@/lib/collections";

type P = { params: Promise<{ kind: string; id: string; imageId: string }> };

export async function PATCH(req: NextRequest, { params }: P) {
  const { kind, id, imageId } = await params;
  if (!isKind(kind)) return bad("Unknown type.", 404);
  if (!(await getSessionUser())) return unauthorized();
  const parsed = z.object({ alt_text: z.string().trim().max(255) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Invalid request.");
  await updateImageAlt(kind, Number(id), Number(imageId), parsed.data.alt_text);
  return ok();
}

export async function DELETE(_req: NextRequest, { params }: P) {
  const { kind, id, imageId } = await params;
  if (!isKind(kind)) return bad("Unknown type.", 404);
  if (!(await getSessionUser())) return unauthorized();
  return (await removeImage(kind, Number(id), Number(imageId))) ? ok() : bad("Photo not found.", 404);
}
