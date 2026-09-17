import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const aqui = fileURLToPath(new URL('.', import.meta.url))

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
      /* Multi-page: cada página de nicho é um HTML estático próprio (sem React,
         sem canvas), servido em /<pasta>/ pelo GitHub Pages. O Vite preserva o
         caminho relativo dos HTMLs de entrada dentro do dist. */
      input: {
        home: aqui + 'index.html',
        clinica: aqui + 'site-para-clinica-odontologica/index.html',
        modaFitness: aqui + 'loja-virtual-moda-fitness/index.html',
        casoVoke: aqui + 'casos/voke-wear/index.html',
        automacao: aqui + 'automacao-de-atendimento/index.html',
        lojaVirtual: aqui + 'loja-virtual/index.html',
        sites: aqui + 'sites/index.html',
        sistemas: aqui + 'sistemas-sob-medida/index.html',
        manutencao: aqui + 'manutencao-mensal/index.html',
      },
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
