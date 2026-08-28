import { mkdir, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { StorageProvider, StoredFile } from "@/domain/storage/ports";

/**
 * Driver local para desarrollo: escribe en public/uploads.
 * En producción se usa el driver S3 (STORAGE_DRIVER=s3).
 */
export class LocalStorageProvider implements StorageProvider {
  readonly driver = "local" as const;

  isConfigured(): boolean {
    return true;
  }

  async put(params: {
    folder: string;
    filename: string;
    contentType: string;
    body: Buffer;
  }): Promise<StoredFile> {
    const safeFolder = params.folder.replace(/[^a-z0-9/_-]/gi, "");
    const dir = join(process.cwd(), "public", "uploads", safeFolder);
    await mkdir(dir, { recursive: true });

    const path = join(dir, params.filename);
    await writeFile(path, params.body);

    const key = `uploads/${safeFolder}/${params.filename}`;
    return {
      url: `/${key}`,
      key,
      sizeBytes: params.body.byteLength,
      contentType: params.contentType,
    };
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(join(process.cwd(), "public", key.replace(/^\/+/, "")));
    } catch {
      // El archivo ya no existe: no es un error para el dominio.
    }
  }
}
