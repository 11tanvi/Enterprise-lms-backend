import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import path from "path";
import { defineConfig } from "vite";

// Load environment variables from the workspace root and frontend folder
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, ".env") });

export default defineConfig(() => {
  // Inject any process.env variables starting with VITE_ so they are accessible in the client bundle
  const processEnvDefs: Record<string, string> = {};
  for (const key in process.env) {
    if (key.startsWith("VITE_")) {
      processEnvDefs[`import.meta.env.${key}`] = JSON.stringify(
        process.env[key],
      );
    }
  }

  return {
    plugins: [react(), tailwindcss()],
    define: processEnvDefs,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== "true",
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === "true" ? null : {},
    },
  };
});
