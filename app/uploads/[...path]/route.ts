import { NextRequest, NextResponse } from "next/server";
import { promises as fs, createReadStream } from "fs";
import { Readable } from "stream";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), "storage", "uploads");
const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".avif": "image/avif", ".gif": "image/gif", ".ico": "image/x-icon", ".svg": "image/svg+xml",
  ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
};

// Serves locally stored uploads (development storage provider only), with HTTP Range
// support so videos can seek.
export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const name = path.basename((await params).path.join("/"));
  const type = TYPES[path.extname(name).toLowerCase()];
  if (!type) return new NextResponse("Not found", { status: 404 });
  const file = path.join(UPLOAD_DIR, name);

  let size: number;
  try { size = (await fs.stat(file)).size; } catch { return new NextResponse("Not found", { status: 404 }); }

  const headers: Record<string, string> = {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    // Filenames are random UUIDs, so a file's content never changes.
    "Cache-Control": "public, max-age=31536000, immutable",
    // SVGs can carry script; never let one execute if opened directly.
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    "X-Content-Type-Options": "nosniff",
  };

  const range = req.headers.get("range");
  let start = 0, end = size - 1, status = 200;
  if (range) {
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (!m || (m[1] === "" && m[2] === "")) return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    if (m[1] === "") { start = Math.max(size - Number(m[2]), 0); }
    else { start = Number(m[1]); if (m[2] !== "") end = Math.min(Number(m[2]), size - 1); }
    if (start > end || start >= size) return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    status = 206;
    headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
  }
  headers["Content-Length"] = String(end - start + 1);
  const stream = Readable.toWeb(createReadStream(file, { start, end })) as unknown as ReadableStream;
  return new NextResponse(stream, { status, headers });
}
