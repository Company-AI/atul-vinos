import type { StorageProvider } from "@/domain/storage/ports";
import { LocalStorageProvider } from "./local";
import { S3StorageProvider } from "./s3";

const local = new LocalStorageProvider();
const s3 = new S3StorageProvider();

export function getStorage(): StorageProvider {
  if (process.env.STORAGE_DRIVER === "s3" && s3.isConfigured()) return s3;
  return local;
}
