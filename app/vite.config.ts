import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    plugins: [
      !isProd && inspectAttr(),
      react()
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // Keep the PDF stack out of the eager chunks — it must only
              // load with the lazy /resume route.
              if (id.includes('pdfjs-dist') || id.includes('react-pdf')) {
                return 'vendor-pdf';
              }
              // Three.js stack only loads with the lazy Showcase chunk —
              // must match before the generic 'react' check or
              // @react-three/fiber lands in the eager vendor-react chunk.
              if (id.includes('node_modules/three/') || id.includes('@react-three')) {
                return 'vendor-three';
              }
              if (id.includes('recharts') || id.includes('d3') || id.includes('react-resize-detector')) {
                return 'vendor-charts';
              }
              if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) {
                return 'vendor-motion';
              }
              if (id.includes('react') || id.includes('scheduler')) {
                return 'vendor-react';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              return 'vendor-core';
            }
          }
        }
      }
    }
  };
});
