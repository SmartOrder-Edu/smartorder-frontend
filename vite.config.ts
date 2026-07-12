import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue(), VueDevTools()],
  define: {
    // 自动检测并注入 Windows 本地系统环境变量 (支持 github_client_id / client_id 各种小写变体)
    'import.meta.env.VITE_GITHUB_CLIENT_ID': JSON.stringify(
      process.env.VITE_GITHUB_CLIENT_ID ||
      process.env.github_client_id ||
      process.env.client_id ||
      process.env.GITHUB_CLIENT_ID ||
      'MOCK'
    )
  },
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
      },
      '/study-assets': {
        target: 'http://localhost:9015',
        changeOrigin: true
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
