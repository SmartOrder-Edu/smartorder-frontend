import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'
export type LanguageMode = 'system' | 'zh-CN' | 'en-US'
export type ResolvedLanguage = 'zh-CN' | 'en-US'

export const useAppStore = defineStore('app', () => {
  const state = ref({
    sidebar: {
      opened: true,
      withoutAnimation: false
    },
    device: 'desktop',
    size: 'default'
  })

  const sidebar = computed(() => state.value.sidebar)
  const device = computed(() => state.value.device)
  const size = computed(() => state.value.size)

  function toggleSidebar() {
    state.value.sidebar.opened = !state.value.sidebar.opened
    state.value.sidebar.withoutAnimation = false
  }

  function closeSidebar(withoutAnimation = false) {
    state.value.sidebar.opened = false
    state.value.sidebar.withoutAnimation = withoutAnimation
  }

  function openSidebar() {
    state.value.sidebar.opened = true
  }

  function toggleDevice(device: string) {
    state.value.device = device
  }

  function setSize(size: string) {
    state.value.size = size
  }

  // === 新增主题 & 语言状态 ===
  const themeMode = ref<ThemeMode>((localStorage.getItem('theme-mode') as ThemeMode) || 'system')
  const resolvedTheme = ref<ResolvedTheme>('light')
  
  const language = ref<LanguageMode>((localStorage.getItem('language-mode') as LanguageMode) || 'system')
  
  // 语言解析逻辑
  const resolvedLanguage = computed<ResolvedLanguage>(() => {
    if (language.value === 'system') {
      const sysLang = navigator.language
      return sysLang.startsWith('en') ? 'en-US' : 'zh-CN'
    }
    return language.value
  })

  // 系统主题变化监听器
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const handleSystemThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
    if (themeMode.value === 'system') {
      resolvedTheme.value = e.matches ? 'dark' : 'light'
      document.documentElement.dataset.theme = resolvedTheme.value
    }
  }

  // 监听系统主题的 helper 方法
  let isListeningToSystemTheme = false
  function startSystemThemeListener() {
    if (isListeningToSystemTheme) return
    // 兼容现代浏览器
    mediaQuery.addEventListener('change', handleSystemThemeChange)
    isListeningToSystemTheme = true
  }

  function stopSystemThemeListener() {
    if (!isListeningToSystemTheme) return
    mediaQuery.removeEventListener('change', handleSystemThemeChange)
    isListeningToSystemTheme = false
  }

  // 计算并应用 resolvedTheme 的核心方法
  function applyTheme() {
    if (themeMode.value === 'system') {
      resolvedTheme.value = mediaQuery.matches ? 'dark' : 'light'
      startSystemThemeListener()
    } else {
      resolvedTheme.value = themeMode.value
      stopSystemThemeListener()
    }
    document.documentElement.dataset.theme = resolvedTheme.value
  }

  // 初始化主题（首屏渲染后同步状态）
  applyTheme()

  // 暴露设置主题模式方法
  function setThemeMode(mode: ThemeMode) {
    themeMode.value = mode
    localStorage.setItem('theme-mode', mode)
    applyTheme()
  }

  // 暴露设置语言模式方法
  function setLanguage(lang: LanguageMode) {
    language.value = lang
    localStorage.setItem('language-mode', lang)
  }

  return {
    sidebar,
    device,
    size,
    toggleSidebar,
    closeSidebar,
    openSidebar,
    toggleDevice,
    setSize,
    
    // 新增
    themeMode,
    resolvedTheme,
    language,
    resolvedLanguage,
    setThemeMode,
    setLanguage
  }
})
