import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { bad, ok, unauthorized } from "@/lib/api";
import { addImages, isKind, reorderImages } from "@/lib/collections";

type P = { params: Promise<{ kind: string; id: string }> };

export async function POST(req: NextRequest, { params }: P) {
  const { kind, id } = await params;
  if (!isKind(kind)) return bad("Unknown type.", 404);
  if (!(await getSessionUser())) return unauthorized();
  const files = (await req.formData()).getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return bad("Choose at least one photo.");
  const r = await addImages(kind, Number(id), files);
  return NextResponse.json({ ok: r.added > 0, ...r }, { status: r.added ? 200 : 400 });
}

export async function PUT(req: NextRequest, { params }: P) {
  const { kind, id } = await params;
  if (!isKind(kind)) return bad("Unknown type.", 404);
  if (!(await getSessionUser())) return unauthorized();
  const parsed = z.object({ ids: z.array(z.number().int()).min(1) }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad("Invalid order.");
  await reorderImages(kind, Number(id), parsed.data.ids);
  return ok();
}
