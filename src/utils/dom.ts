/**
 * 添加类名
 */
export function addClass(el: HTMLElement, className: string): void {
  if (!el.classList.contains(className)) {
    el.classList.add(className)
  }
}

/**
 * 移除类名
 */
export function removeClass(el: HTMLElement, className: string): void {
  el.classList.remove(className)
}

/**
 * 切换类名
 */
export function toggleClass(el: HTMLElement, className: string): void {
  el.classList.toggle(className)
}

/**
 * 判断是否包含类名
 */
export function hasClass(el: HTMLElement, className: string): boolean {
  return el.classList.contains(className)
}

/**
 * 获取元素样式
 */
export function getStyle(el: HTMLElement, styleName: string): string {
  return getComputedStyle(el, null).getPropertyValue(styleName)
}

/**
 * 设置元素样式
 */
export function setStyle(el: HTMLElement, styleName: string | Record<string, string>, value?: string): void {
  if (typeof styleName === 'string') {
    el.style[styleName as any] = value ?? ''
  } else {
    Object.keys(styleName).forEach(key => {
      el.style[key as any] = styleName[key]
    })
  }
}

/**
 * 获取元素偏移量
 */
export function getOffset(el: HTMLElement): { top: number; left: number } {
  let top = 0
  let left = 0
  while (el.offsetParent) {
    top += el.offsetTop
    left += el.offsetLeft
    el = el.offsetParent as HTMLElement
  }
  return { top, left }
}

/**
 * 获取滚动容器
 */
export function getScrollContainer(el: HTMLElement): HTMLElement | Window {
  let parent = el
  while (parent) {
    if (parent === document.body || parent === document.documentElement) {
      return window
    }
    const overflow = getStyle(parent, 'overflow')
    const overflowY = getStyle(parent, 'overflow-y')
    if ((overflow === 'auto' || overflow === 'scroll' || overflowY === 'auto' || overflowY === 'scroll') &&
        parent.scrollHeight > parent.clientHeight) {
      return parent
    }
    parent = parent.parentElement as HTMLElement
  }
  return window
}

/**
 * 平滑滚动到元素
 */
export function scrollIntoView(el: HTMLElement, offsetTop = 0): void {
  const { top } = getOffset(el)
  const targetScrollTop = top - offsetTop

  if (getScrollContainer(el) instanceof Window) {
    window.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    })
  } else {
    (getScrollContainer(el) as HTMLElement).scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    })
  }
}

/**
 * 监听元素是否进入视口
 */
export function useIntersectionObserver(
  el: HTMLElement,
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const observer = new IntersectionObserver(callback, {
    rootMargin: '0px',
    threshold: 0.1,
    ...options
  })
  observer.observe(el)
  return observer
}
