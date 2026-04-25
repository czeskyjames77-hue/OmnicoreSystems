import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  // Beim Pages-Build über GitHub Actions wird BASE_PATH gesetzt (z.B. "/OmnicoreSystems/").
  // Lokal/Vercel fällt es auf "/" zurück.
  base: process.env.BASE_PATH || '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
