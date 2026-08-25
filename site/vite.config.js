import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Build fica em site/dist; o script deploy-root.mjs copia para a raiz do repo
// (onde o GitHub Pages serve), preservando CNAME, .nojekyll e index.md.
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
})
