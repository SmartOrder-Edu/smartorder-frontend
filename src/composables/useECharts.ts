/**
 * ECharts 生命周期管理组合式函数
 * 统一处理 init / setOption / resize / dispose / dark-mode 切换
 */
import { ref, onBeforeUnmount, type Ref, type MaybeRef } from 'vue'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

export interface UseEChartsOptions {
  /** 手动指定主题，默认跟随 html[data-theme] 属性自动切换 */
  theme?: MaybeRef<'light' | 'dark'>
  /** 是否监听窗口 resize，默认 true */
  autoResize?: boolean
}

export function useECharts(
  chartRef: Ref<HTMLElement | null>,
  options?: UseEChartsOptions
) {
  const { autoResize = true } = options ?? {}

  const instance = ref<echarts.ECharts | null>(null)
  const currentTheme = ref<'light' | 'dark'>('light')

  /** 从 html[data-theme] 读取当前主题 */
  function detectTheme(): 'light' | 'dark' {
    if (typeof document === 'undefined') return 'light'
    const attr = document.documentElement.getAttribute('data-theme')
    return attr === 'dark' ? 'dark' : 'light'
  }

  /** 初始化实例 */
  function init() {
    const dom = chartRef.value
    if (!dom) return

    // 先释放旧实例
    if (instance.value) {
      instance.value.dispose()
      instance.value = null
    }

    currentTheme.value = detectTheme()
    instance.value = echarts.init(dom, currentTheme.value)
  }

  /** 设置 option */
  function setOption(option: EChartsOption, notMerge = false) {
    if (!instance.value || instance.value.isDisposed()) {
      init()
    }
    if (!instance.value) return

    // 根据 prefers-reduced-motion 调整动画时长
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    const finalOption: EChartsOption = prefersReduced
      ? { ...option, animation: false }
      : {
          ...option,
          animationDuration: option.animationDuration ?? 600,
          animationEasing: option.animationEasing ?? 'cubicOut',
        }

    instance.value.setOption(finalOption, notMerge)
  }

  /** resize */
  function resize() {
    instance.value?.resize()
  }

  /** 释放 */
  function dispose() {
    if (instance.value && !instance.value.isDisposed()) {
      instance.value.dispose()
    }
    instance.value = null
  }

  // ==== 主题切换监听 ====
  let themeObserver: MutationObserver | null = null
  if (typeof MutationObserver !== 'undefined') {
    themeObserver = new MutationObserver(() => {
      const newTheme = detectTheme()
      if (newTheme !== currentTheme.value) {
        // 主题变化时重建实例
        const dom = chartRef.value
        if (!dom) return
        dispose()
        currentTheme.value = newTheme
        instance.value = echarts.init(dom, newTheme)
      }
    })
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
  }

  // ==== resize 监听 ====
  let resizeHandler: (() => void) | null = null
  if (autoResize) {
    resizeHandler = () => resize()
    window.addEventListener('resize', resizeHandler)
  }

  // ==== prefers-reduced-motion 监听 ====
  let motionQuery: MediaQueryList | null = null
  let motionHandler: (() => void) | null = null
  if (typeof window !== 'undefined') {
    motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    motionHandler = () => {
      if (motionQuery?.matches && instance.value && !instance.value.isDisposed()) {
        // 关闭动画
        instance.value.setOption({ animation: false } as EChartsOption)
      }
    }
    motionQuery.addEventListener('change', motionHandler)
  }

  // ==== 生命周期 ====
  onBeforeUnmount(() => {
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler)
    }
    if (motionQuery && motionHandler) {
      motionQuery.removeEventListener('change', motionHandler)
    }
    themeObserver?.disconnect()
    dispose()
  })

  return {
    instance,
    init,
    setOption,
    resize,
    dispose,
    currentTheme,
  }
}
