export type UploadResult = {
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
};

export interface StorageProvider {
  /** Persist a file and return the info needed for a `media` row. */
  upload(file: File): Promise<UploadResult>;
  /** Remove a previously uploaded file. Safe to call on an already-missing file. */
  delete(url: string): Promise<void>;
}

/**
 * Provider is chosen by STORAGE_PROVIDER so the rest of the app never
 * imports a concrete provider directly. To add S3/Cloudinary/etc. later:
 * implement the StorageProvider interface in a new file in this folder
 * and add a case below — no feature code needs to change.
 */
export async function getStorageProvider(): Promise<StorageProvider> {
  const provider = process.env.STORAGE_PROVIDER || "local";

  switch (provider) {
    case "local": {
      const { LocalStorageProvider } = await import("./local");
      return new LocalStorageProvider();
    }
    default:
      throw new Error(
        `Unknown STORAGE_PROVIDER "${provider}". Implement lib/storage/${provider}.ts and register it in lib/storage/index.ts.`
      );
  }
}
