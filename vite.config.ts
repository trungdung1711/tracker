import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        background: "src/main/background.ts",
        content: "src/main/content.ts",
        popup: "src/main/popup.ts",
      },
      output: {
        entryFileNames: "[name].js"
      }
    }
  }
});
