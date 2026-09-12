import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'spa-fallback-404',
      closeBundle() {
        const index = path.resolve('dist/index.html')
        if (fs.existsSync(index)) fs.copyFileSync(index, path.resolve('dist/404.html'))
        fs.writeFileSync(path.resolve('dist/.nojekyll'), '')
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
})
