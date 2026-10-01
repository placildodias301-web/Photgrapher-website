import { promises as fs, createWriteStream } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import sharp from "sharp";
import type { StorageProvider, UploadResult } from "./index";

// Outside /public on purpose: Next.js only serves public/ files that existed at build time,
// so runtime CMS uploads are served by app/uploads/[...path]/route.ts instead.
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), "storage", "uploads");

/** Development storage: writes to ./storage/uploads. Swap for S3/Cloudinary in production. */
export class LocalStorageProvider implements StorageProvider {
  async upload(file: File): Promise<UploadResult> {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const ext = path.extname(file.name).toLowerCase().replace(/[^.a-z0-9]/g, "") || "";
    const fileName = `${randomUUID()}${ext}`;
    const target = path.join(UPLOAD_DIR, fileName);

    // Stream to disk so a large video never has to sit in memory twice.
    await pipeline(Readable.fromWeb(file.stream() as unknown as import("stream/web").ReadableStream), createWriteStream(target));
    const { size } = await fs.stat(target);

    let width: number | undefined;
    let height: number | undefined;
    if (file.type.startsWith("image/") && file.type !== "image/svg+xml") {
      try {
        const meta = await sharp(target).metadata();
        width = meta.width;
        height = meta.height;
      } catch {
        /* dimensions are optional */
      }
    }

    return { url: `/uploads/${fileName}`, fileName, fileSize: size, mimeType: file.type, width, height };
  }

  async delete(url: string): Promise<void> {
    if (!url.startsWith("/uploads/")) return;
    await fs.unlink(path.join(UPLOAD_DIR, path.basename(url))).catch(() => {});
  }
}
