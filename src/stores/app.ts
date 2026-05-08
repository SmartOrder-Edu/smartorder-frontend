import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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

  return {
    sidebar,
    device,
    size,
    toggleSidebar,
    closeSidebar,
    openSidebar,
    toggleDevice,
    setSize
  }
})
