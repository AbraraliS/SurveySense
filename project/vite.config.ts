import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {}, // Add this to prevent process errors
  },
  server: {
    port: 5173,
    host: true, // Allow external connections
  },
  preview: {
    port: 5173,
  },
});
