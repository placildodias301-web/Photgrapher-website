import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { bad, ok, unauthorized } from "@/lib/api";
import { collectionSchema, deleteCollection, getCollection, isKind, updateCollection } from "@/lib/collections";

type P = { params: Promise<{ kind: string; id: string }> };

export async function GET(_req: NextRequest, { params }: P) {
  const { kind, id } = await params;
  if (!isKind(kind)) return bad("Unknown type.", 404);
  if (!(await getSessionUser())) return unauthorized();
  const item = await getCollection(kind, Number(id));
  return item ? NextResponse.json(item) : bad("Not found.", 404);
}

export async function PATCH(req: NextRequest, { params }: P) {
  const { kind, id } = await params;
  if (!isKind(kind)) return bad("Unknown type.", 404);
  if (!(await getSessionUser())) return unauthorized();
  const parsed = collectionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad(parsed.error.issues[0].message);
  return (await updateCollection(kind, Number(id), parsed.data)) ? ok() : bad("Not found.", 404);
}

export async function DELETE(_req: NextRequest, { params }: P) {
  const { kind, id } = await params;
  if (!isKind(kind)) return bad("Unknown type.", 404);
  if (!(await getSessionUser())) return unauthorized();
  return (await deleteCollection(kind, Number(id))) ? ok() : bad("Not found.", 404);
}
