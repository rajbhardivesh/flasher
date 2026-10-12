import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Using a relative base path ("./") so the built app works correctly
// when hosted on GitHub Pages under https://<user>.github.io/<repo>/
// without needing to know the repository name in advance.
export default defineConfig({
    base: "./",
    plugins: [react()],
    build: {
        outDir: "dist",
    },
    server: {
        // Web Serial API requires a secure context (https or localhost).
        // The Vite dev server on localhost satisfies this requirement.
        port: 5173,
    },
});
