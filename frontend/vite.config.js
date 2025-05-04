import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // good for relative paths if not using a domain/subpath
  server: {
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 1000, // increase warning threshold (optional)
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf-tools';
            }
            return 'vendor';
          }
        },
      },
    },
  },
});
