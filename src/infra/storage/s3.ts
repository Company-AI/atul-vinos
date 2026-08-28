import type { StorageProvider, StoredFile } from "@/domain/storage/ports";

/**
 * Driver S3-compatible (AWS S3, Cloudflare R2, MinIO).
 *
 * Requiere las variables S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID,
 * S3_SECRET_ACCESS_KEY y S3_PUBLIC_URL, y el paquete @aws-sdk/client-s3.
 * Mientras no esté configurado, el registry usa el driver local.
 */
export class S3StorageProvider implements StorageProvider {
  readonly driver = "s3" as const;

  isConfigured(): boolean {
    return Boolean(
      process.env.S3_BUCKET &&
        process.env.S3_ACCESS_KEY_ID &&
        process.env.S3_SECRET_ACCESS_KEY &&
        process.env.S3_PUBLIC_URL,
    );
  }

  async put(): Promise<StoredFile> {
    throw new Error(
      "El driver S3 todavía no está implementado. Instalá @aws-sdk/client-s3, " +
        "cargá las credenciales S3_* y completá S3StorageProvider.put().",
    );
  }

  async delete(): Promise<void> {
    throw new Error("El driver S3 todavía no está implementado.");
  }
}
