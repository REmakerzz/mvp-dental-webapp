import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'fix-asset-paths',
      transformIndexHtml(html) {
        // Заменяем абсолютные пути на относительные
        return html.replace(/href="\/assets\//g, 'href="assets/')
                  .replace(/src="\/assets\//g, 'src="assets/');
      },
    },
  ],
  base: '/mvp-dental-webapp/', // Базовый путь для GitHub Pages
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // Используем фиксированные имена файлов без хешей
        assetFileNames: 'assets/[name][extname]',
        chunkFileNames: 'assets/[name].js',
        entryFileNames: 'assets/[name].js',
      },
    },
  },
}) 