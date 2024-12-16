import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core dependencies
          if (id.includes('node_modules/react/') || 
              id.includes('node_modules/react-dom/') || 
              id.includes('node_modules/react-router-dom/')) {
            return 'react-vendor';
          }
          // UI dependencies
          if (id.includes('@tremor/react') || 
              id.includes('@tailwindcss/forms') || 
              id.includes('lucide-react') || 
              id.includes('react-icons')) {
            return 'ui-vendor';
          }
          // Individual chart chunks
          if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
            return 'chartjs-vendor';
          }
          if (id.includes('plotly.js') || id.includes('react-plotly.js')) {
            return 'plotly-vendor';
          }
          if (id.includes('recharts')) {
            return 'recharts-vendor';
          }
          if (id.includes('@nivo')) {
            return 'nivo-vendor';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      // Add polyfills for browser compatibility
      transformMixedEsModules: true,
      include: [/node_modules/]
    }
  },
  resolve: {
    alias: {
      // Provide polyfills for Node.js built-in modules
      buffer: 'buffer/',
      stream: 'stream-browserify',
      assert: 'assert/'
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      }
    }
  }
})
