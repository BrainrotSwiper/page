import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
export default defineConfig({
    plugins: [react()],
    base: '/page/', // GitHub Pages repository name
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
