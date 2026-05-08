import type { Directive, DirectiveBinding } from 'vue'

interface DebounceFunction {
  (): void
  _timer?: ReturnType<typeof setTimeout>
}

const debounce: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<DebounceFunction>) {
    let timer: ReturnType<typeof setTimeout> | undefined
    const delay = Number(binding.arg) || 300

    el.addEventListener('click', () => {
      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(() => {
        binding.value()
      }, delay)
    })
  }
}

export default debounce
