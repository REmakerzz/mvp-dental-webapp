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
        const fixedHtml = html
          .replace(/href="\/assets\//g, 'href="assets/')
          .replace(/src="\/assets\//g, 'src="assets/')
          .replace(/href="\/\//g, 'href="//')  // Сохраняем внешние URL
          .replace(/src="\/\//g, 'src="//');   // Сохраняем внешние URL
        
        // Проверяем, были ли исправления
        if (html !== fixedHtml) {
          console.log('⚠️  Исправлены абсолютные пути в index.html на относительные');
        }
        
        return fixedHtml;
      },
    },
  ],
  base: '/mvp-dental-webapp/', // Путь к репозиторию на GitHub Pages
  build: {
    // Гарантируем, что все ассеты будут использовать относительные пути
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