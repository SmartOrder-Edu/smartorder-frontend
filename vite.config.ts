import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue(), VueDevTools()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/views': resolve(__dirname, 'src/views'),
      '@/api': resolve(__dirname, 'src/api'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/stores': resolve(__dirname, 'src/stores'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/assets': resolve(__dirname, 'src/assets'),
      '@/router': resolve(__dirname, 'src/router'),
      '@/composables': resolve(__dirname, 'src/composables'),
      '@/directives': resolve(__dirname, 'src/directives'),
      '@/layouts': resolve(__dirname, 'src/layouts')
    }
  },
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  },
  server: {
    port: 5172,
    proxy: {
      '/api': {
        target: 'http://localhost:9015',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  optimizeDeps: {},
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    cssCodeSplit: true
  }
})
