/**
 * IntersectionObserver section 滚动跟踪组合式函数
 * 跟踪页面中各 section 的可见性，返回当前活跃 section ID
 */
import { ref, onMounted, onBeforeUnmount, type Ref, type ComputedRef, isRef } from 'vue'

export interface ScrollSpySection {
  id: string
  el: Element | null
}

export function useScrollSpy(sections: Ref<ScrollSpySection[]> | ComputedRef<ScrollSpySection[]>) {
  const activeSectionId = ref<string>('')

  let observer: IntersectionObserver | null = null

  function getSections(): ScrollSpySection[] {
    return isRef(sections) ? sections.value : sections
  }

  function setupObserver() {
    if (typeof IntersectionObserver === 'undefined') return

    // 使用 rootMargin 使顶部有偏移量，这样滚动到 section 顶部时才激活
    observer = new IntersectionObserver(
      (entries) => {
        // 找出所有当前可见的 section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => e.target.getAttribute('data-section-id') || '')
          .filter(Boolean)

        if (visible.length > 0) {
          // 取第一个（最靠上的）可见 section
          activeSectionId.value = visible[0]
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      }
    )

    // 观察所有 section 元素
    const list = getSections()
    list.forEach((sec) => {
      const el =
        sec.el || document.querySelector(`[data-section-id="${sec.id}"]`)
      if (el) {
        observer!.observe(el)
      }
    })
  }

  function scrollToSection(id: string) {
    const el = document.querySelector(`[data-section-id="${id}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  onMounted(() => {
    setupObserver()
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return {
    activeSectionId,
    scrollToSection,
  }
}
