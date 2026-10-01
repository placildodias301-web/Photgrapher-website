import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { bad, unauthorized } from "@/lib/api";
import { collectionSchema, createCollection, isKind, listCollection, parseFormFields } from "@/lib/collections";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!isKind(kind)) return bad("Unknown type.", 404);
  if (!(await getSessionUser())) return unauthorized();
  return NextResponse.json({ items: await listCollection(kind) });
}

// Multipart: fields + optional `cover` file + any number of `gallery` files.
export async function POST(req: NextRequest, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!isKind(kind)) return bad("Unknown type.", 404);
  if (!(await getSessionUser())) return unauthorized();
  const fd = await req.formData();
  const parsed = collectionSchema.safeParse(parseFormFields(fd));
  if (!parsed.success) return bad(parsed.error.issues[0].message);
  const cover = fd.get("cover");
  const gallery = fd.getAll("gallery").filter((f): f is File => f instanceof File && f.size > 0);
  const r = await createCollection(kind, parsed.data, cover instanceof File && cover.size > 0 ? cover : null, gallery);
  return NextResponse.json({ ok: true, ...r });
}
