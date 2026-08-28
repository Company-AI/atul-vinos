export type StoredFile = {
  /** URL pública servible por next/image. */
  url: string;
  /** Clave interna para poder borrar el archivo después. */
  key: string;
  width?: number;
  height?: number;
  sizeBytes: number;
  contentType: string;
};

export interface StorageProvider {
  readonly driver: "local" | "s3";
  isConfigured(): boolean;
  put(params: {
    folder: string;
    filename: string;
    contentType: string;
    body: Buffer;
  }): Promise<StoredFile>;
  delete(key: string): Promise<void>;
}

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/avif",
] as const;

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 60 * 1024 * 1024;
