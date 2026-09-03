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
    /* Testado e descartado: tirar o chunk `three` do modulepreload não mudou
       o FCP (mediana 460ms → 456ms em Fast 3G, dentro do ruído) e ATRASA as
       partículas, já que o canvas é visível desde o hero. O preload fica. */
    rollupOptions: {
      output: {
        /* Função, não objeto: com `{three: ['three','@react-three/*']}` o Rollup
           arrastava o React para dentro do chunk do three (fiber depende dele),
           e o modulepreload puxava ~958KB antes do primeiro pixel — anulando o
           lazy load do canvas. Aqui o 3D fica isolado de verdade. */
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('/three/') || id.includes('@react-three') || id.includes('/zustand/')) {
            return 'three'
          }
          return 'vendor' // react, react-dom, gsap, lenis
        },
      },
    },
  },
})
