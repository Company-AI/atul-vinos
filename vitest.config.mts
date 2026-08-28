import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { config } from "dotenv";

// Los tests corren contra una base propia (bodega_test), nunca contra la de desarrollo.
config({ path: ".env.test", override: true });

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // Las pruebas comparten la base: se ejecutan en serie.
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
