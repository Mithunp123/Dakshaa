import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.heic'],
  server: {
    host: true,
    allowedHosts: ['faec88edfa59.ngrok-free.app']
  }
})
