import { NextRequest, NextResponse } from "next/server";

// Lightweight gate: real session validation happens server-side (DB lookup)
// in getSessionUser(). This just keeps anonymous visitors out of /dashboard.
export function proxy(req: NextRequest) {
  const hasCookie = req.cookies.get("pascoal_session")?.value;
  if (!hasCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*"] };
