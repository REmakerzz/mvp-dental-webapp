import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'fix-asset-paths',
      transformIndexHtml(html) {
        // Автоматически исправляем абсолютные пути на относительные
        return html.replace(/href="\/assets\//g, 'href="assets/')
                  .replace(/src="\/assets\//g, 'src="assets/');
      },
    },
  ],
  base: '/mvp-dental-webapp/', // Путь к репозиторию на GitHub Pages
  build: {
    // Гарантируем, что все ассеты будут использовать относительные пути
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
}) 