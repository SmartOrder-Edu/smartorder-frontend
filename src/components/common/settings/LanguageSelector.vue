<template>
  <div class="language-selector">
    <el-select
      v-model="selectedLanguage"
      class="lang-select"
      size="default"
      :aria-label="t('language')"
      @change="handleLanguageChange"
    >
      <el-option :label="t('langSystem')" value="system" />
      <el-option :label="t('langZh')" value="zh-CN" />
      <el-option :label="t('langEn')" value="en-US" />
    </el-select>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { useI18n } from '@/composables/useI18n'

const appStore = useAppStore()
const { t } = useI18n()

const selectedLanguage = ref(appStore.language)

// 监听 store 中语言的变化以保持同步
watch(() => appStore.language, (newVal) => {
  selectedLanguage.value = newVal
})

const handleLanguageChange = (val: any) => {
  appStore.setLanguage(val)
}
</script>

<style lang="scss">
.lang-select {
  width: 140px;

  .el-input__wrapper {
    border-radius: 12px !important;
    background-color: var(--hover-bg) !important;
    box-shadow: none !important;
    border: 1px solid var(--border-color) !important;
    padding: 6px 16px !important;
    transition: background-color 0.2s ease, border-color 0.2s ease;

    &:hover {
      background-color: var(--active-bg) !important;
    }
  }

  .el-input__inner {
    font-size: 13px !important;
    font-weight: 500 !important;
    color: var(--text-primary) !important;
  }
}
</style>
