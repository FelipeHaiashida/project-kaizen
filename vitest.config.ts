import { defineConfig } from "vitest/config";
import path from "node:path";

const rootDir = path.resolve(process.cwd());

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    globals: false,
  },
  resolve: {
    alias: [{ find: /^@\//, replacement: `${rootDir}/` }],
  },
});
