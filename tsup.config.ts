import { copyFileSync } from "fs";
import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  async onSuccess() {
    copyFileSync("README.md", "dist/README.md");
  },
});
