import { onBeforeUnmount, ref, watch, type Ref } from 'vue'

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

/**
 * 数字滚动动画。target 变化时从当前值平滑过渡到新值。
 * 仅依赖 requestAnimationFrame，800ms ease-out cubic。
 *
 * @example
 * const target = ref(5)
 * const display = useCountUp(target)
 * // display.value 会从 0 平滑过渡到 5
 */
export function useCountUp(target: Ref<number> | (() => number), duration = 800): Ref<number> {
  const source = () => (typeof target === 'function' ? target() : target.value)
  const current = ref(0)
  let rafId: number | null = null
  let startTime = 0
  let fromValue = 0
  let toValue = source()

  const tick = (now: number) => {
    if (!startTime) startTime = now
    const elapsed = now - startTime
    const progress = Math.min(1, elapsed / duration)
    const eased = easeOutCubic(progress)
    current.value = fromValue + (toValue - fromValue) * eased
    if (progress < 1) {
      rafId = window.requestAnimationFrame(tick)
    } else {
      current.value = toValue
      rafId = null
    }
  }

  const start = (next: number) => {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId)
    }
    fromValue = current.value
    toValue = next
    startTime = 0
    if (fromValue === toValue) return
    rafId = window.requestAnimationFrame(tick)
  }

  watch(
    () => source(),
    (next) => start(next),
    { immediate: true }
  )

  onBeforeUnmount(() => {
    if (rafId !== null) window.cancelAnimationFrame(rafId)
  })

  return current
}
