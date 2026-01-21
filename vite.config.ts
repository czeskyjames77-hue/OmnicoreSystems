import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  // 1. Sagt Vite, dass die index.html im Root liegt
  root: './', 
  plugins: [react()],
  resolve: {
    alias: {
      // 2. Fix für die roten Fehler: Mappt @ direkt auf deinen Ordner
      '@': path.resolve(__dirname, './frontend/src'),
    },
  },
  build: {
    // 3. Wichtig für Vercel: Alles landet im dist Ordner im Hauptverzeichnis
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
})