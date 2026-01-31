import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.heic'],
  server: {
    host: true,
    allowedHosts: ['235c0de834d2.ngrok-free.app']
  },
  build: {
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 500,
    // Generate source maps only for errors
    sourcemap: false,
    // Optimize CSS
    cssCodeSplit: true,
    // Rollup optimizations
    rollupOptions: {
      input: {
        main: './index.html',
      },
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // Core React libraries
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Animation libraries - loaded separately
          'vendor-animation': ['framer-motion'],
          // Supabase client
          'vendor-supabase': ['@supabase/supabase-js'],
          // UI utilities
          'vendor-ui': ['lucide-react', 'react-hot-toast'],
          // Heavy libraries - lazy loaded
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
          'vendor-charts': ['recharts'],
          // Particles - only needed on home page
          'vendor-particles': ['@tsparticles/react', '@tsparticles/slim'],
        },
        // Optimize chunk file names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@tsparticles/react'], // Don't pre-bundle particles
  },
  publicDir: 'public'
})
