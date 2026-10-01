import { NextResponse } from "next/server";

export const unauthorized = () => NextResponse.json({ error: "Not signed in." }, { status: 401 });
export const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });
export const ok = (extra: Record<string, unknown> = {}) => NextResponse.json({ ok: true, ...extra });
