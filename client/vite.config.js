import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Raise the warning threshold — Three.js is inherently large
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor core: React, router, framer-motion
          'vendor-react': ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
          // 3D layer: only loaded when customer opens the customizer
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
});
