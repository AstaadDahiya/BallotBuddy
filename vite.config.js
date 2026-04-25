import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite Configuration for BallotBuddy
 *
 * Performance optimizations:
 *   - Manual chunk splitting for vendor libraries (React, Firebase)
 *   - Tree-shaking via ES module output
 *   - esbuild minification for production
 *   - Asset inlining threshold for small files
 *   - Chunk size warnings at 300KB
 *
 * @see https://vite.dev/config/
 */
export default defineConfig({
  plugins: [react()],

  // Build optimizations for production efficiency
  build: {
    // Target modern browsers for smaller output
    target: 'es2020',
    // Use default minifier (oxc — built into Vite 8)
    // No source maps in production for smaller bundle
    sourcemap: false,
    // Warn on chunks over 300KB
    chunkSizeWarningLimit: 300,
    // Manual chunk splitting for optimal caching
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunk: React core (changes rarely, cached aggressively)
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor-react';
          }
          // Vendor chunk: Firebase services (loaded async when needed)
          if (id.includes('node_modules/firebase/') || id.includes('node_modules/@firebase/')) {
            return 'vendor-firebase';
          }
        },
      },
    },
    // Inline assets smaller than 4KB as base64
    assetsInlineLimit: 4096,
  },

  // Development server config
  server: {
    // Proxy API calls to the local Express server in dev
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },

  // Test configuration (Vitest)
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js',
  },
})
