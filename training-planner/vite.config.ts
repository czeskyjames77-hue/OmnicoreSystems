import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  // Relative Asset-Pfade — funktioniert auf GitHub Pages unabhängig von der
  // Repo-Casing in der URL. HashRouter macht das unproblematisch.
  base: process.env.BASE_PATH || './',
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
