<template>
  <div 
    class="theme-selector" 
    role="listbox" 
    :aria-label="t('theme')"
  >
    <ThemeOptionCard
      mode="light"
      :label="t('themeLight')"
      :active="appStore.themeMode === 'light'"
      @select="appStore.setThemeMode('light')"
    />
    <ThemeOptionCard
      mode="dark"
      :label="t('themeDark')"
      :active="appStore.themeMode === 'dark'"
      @select="appStore.setThemeMode('dark')"
    />
    <ThemeOptionCard
      mode="system"
      :label="t('themeSystem')"
      :active="appStore.themeMode === 'system'"
      @select="appStore.setThemeMode('system')"
    />
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import { useI18n } from '@/composables/useI18n'
import ThemeOptionCard from './ThemeOptionCard.vue'

const appStore = useAppStore()
const { t } = useI18n()
</script>

<style lang="scss" scoped>
.theme-selector {
  display: flex;
  gap: 16px;
  margin-top: 8px;
  width: 100%;
}
</style>
