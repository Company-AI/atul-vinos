import { config } from "dotenv";

config({ path: ".env.test", override: true });

if (!process.env.DATABASE_URL?.includes("bodega_test")) {
  throw new Error(
    "Los tests deben correr contra bodega_test. Revisá .env.test antes de continuar.",
  );
}
