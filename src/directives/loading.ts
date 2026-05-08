import type { Directive, DirectiveBinding } from 'vue'
import { ElLoading } from 'element-plus'

interface LoadingElement extends HTMLElement {
  instance?: ReturnType<typeof ElLoading.service>
}

const loading: Directive = {
  mounted(el: LoadingElement, binding: DirectiveBinding<boolean>) {
    const isLoading = binding.value
    if (isLoading) {
      el.instance = ElLoading.service({
        lock: true,
        text: '加载中...',
        background: 'rgba(0, 0, 0, 0.7)',
        target: el,
        fullscreen: false
      })
    }
  },
  updated(el: LoadingElement, binding: DirectiveBinding<boolean>) {
    const isLoading = binding.value
    if (isLoading) {
      el.instance = ElLoading.service({
        lock: true,
        text: '加载中...',
        background: 'rgba(0, 0, 0, 0.7)',
        target: el,
        fullscreen: false
      })
    } else {
      el.instance?.close()
    }
  },
  unmounted(el: LoadingElement) {
    el.instance?.close()
  }
}

export default loading
