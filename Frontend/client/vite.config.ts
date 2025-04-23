import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [react(), runtimeErrorOverlay(), themePlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  define: {
    'process.env': process.env
  },
  optimizeDeps: {
    force: true, // Force dependencies optimization
    include: ['react', 'react-dom', 'react-router-dom'], // Commonly used packages
  },
  server: {
    host: true,
    port: 5001,
    hmr: {
      overlay: true
    }
  },
});
