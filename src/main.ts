// ==================== 主题初始化（挂载前）====================
// 在 Vue 应用挂载之前立即读取并应用主题，防止首屏闪白（FOUC）
;(function () {
  const saved = localStorage.getItem('theme-mode') as 'light' | 'dark' | 'system' | null
  const mode = saved || 'system'
  let resolved: 'light' | 'dark'
  if (mode === 'system') {
    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } else {
    resolved = mode
  }
  document.documentElement.setAttribute('data-theme', resolved)
})()

// 抑制 ResizeObserver 循环警告（Element Plus 等库的已知问题，无害）
const originalError = window.console.error
window.console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('ResizeObserver loop')) {
    return
  }
  originalError.apply(window.console, args)
}

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'
import router from './router'
import '@/assets/styles/index.scss'

const app = createApp(App)

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: zhCn })

app.mount('#app')
