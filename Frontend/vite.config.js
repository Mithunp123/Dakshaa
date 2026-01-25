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
    rollupOptions: {
      input: {
        main: './index.html',
      }
    }
  },
  publicDir: 'public'
})
