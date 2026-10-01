import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { bad, ok, unauthorized } from "@/lib/api";
import { deleteFilm, filmSchema, updateFilm } from "@/lib/films";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return unauthorized();
  const parsed = filmSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return bad(parsed.error.issues[0].message);
  return (await updateFilm(Number((await params).id), parsed.data)) ? ok() : bad("Film not found.", 404);
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSessionUser())) return unauthorized();
  return (await deleteFilm(Number((await params).id))) ? ok() : bad("Film not found.", 404);
}
