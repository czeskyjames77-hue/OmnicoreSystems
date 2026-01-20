import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Wir brauchen kein 'root: frontend' mehr, da die index.html im Root liegt.
  // Vite findet den Rest über den Pfad in der index.html
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})