/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: false, // served dynamically by backend
      workbox: {
        importScripts: ['/push-sw.js'],
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
      },
    }),
  ],
  server: {
    allowedHosts: ['localhost', '127.0.0.1', 'moving-koala-briefly.ngrok-free.app'],
    proxy: {
      '/pwa': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/superadmin': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/attachment': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide') || id.includes('emoji-picker') || id.includes('@headlessui')) {
              return 'vendor-ui';
            }
            if (id.includes('leaflet')) {
              return 'vendor-map';
            }
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('@fullcalendar')) {
              return 'vendor-fullcalendar';
            }
            if (id.includes('@apollo') || id.includes('graphql')) {
              return 'vendor-apollo';
            }
            if (id.includes('react-hook-form') || id.includes('zustand') || id.includes('@hello-pangea')) {
              return 'vendor-utils';
            }
            if (id.includes('/node_modules/react/') || id.includes('/node_modules/react-dom/') || id.includes('/node_modules/react-router')) {
              return 'vendor-react';
            }
            return 'vendor-core'; // all other node_modules
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
  },
})
