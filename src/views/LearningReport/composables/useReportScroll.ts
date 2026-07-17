import { computed, onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * 周报 scroll-snap 导航逻辑
 * 抽自原 index.vue 的 handleScroll / scrollToSection / goPreviousSection / goNextSection / handleKeydown
 * @param rootRef 滚动容器
 * @param sectionCount section 总数
 * @param disabled 是否禁用键盘翻页（如抽屉打开时）
 */
export function useReportScroll(
  rootRef: Ref<HTMLElement | null>,
  sectionCount: number,
  disabled?: () => boolean
) {
  const activeSection = ref(0)
  const readingProgress = computed(() =>
    Math.round(((activeSection.value + 1) / sectionCount) * 100)
  )

  function handleScroll() {
    const root = rootRef.value
    if (!root) return
    const next = Math.round(root.scrollTop / root.clientHeight)
    activeSection.value = Math.min(sectionCount - 1, Math.max(0, next))
  }

  function scrollToSection(index: number) {
    const root = rootRef.value
    if (!root) return
    const clamped = Math.min(sectionCount - 1, Math.max(0, index))
    root.scrollTo({ top: root.clientHeight * clamped, behavior: 'smooth' })
  }

  function goPreviousSection() {
    scrollToSection(activeSection.value - 1)
  }

  function goNextSection() {
    scrollToSection(activeSection.value + 1)
  }

  function handleKeydown(event: KeyboardEvent) {
    // 抽屉打开时禁用翻页，由抽屉自己处理 Escape
    if (disabled?.()) return
    if (event.key === 'ArrowDown' || event.key === 'PageDown') {
      event.preventDefault()
      goNextSection()
    }
    if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault()
      goPreviousSection()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeydown)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown)
  })

  return {
    activeSection,
    readingProgress,
    handleScroll,
    scrollToSection,
    goPreviousSection,
    goNextSection,
  }
}
