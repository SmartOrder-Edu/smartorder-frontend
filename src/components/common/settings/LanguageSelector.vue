<template>
  <div class="language-selector">
    <el-select
      v-model="selectedLanguage"
      class="lang-select language-select"
      popper-class="language-dropdown"
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
/* ======= 浅色主题 ======= */
.lang-select {
  width: 140px;

  .el-input__wrapper {
    border-radius: 12px !important;
    background-color: var(--item-hover-bg) !important;
    box-shadow: none !important;
    border: 1px solid var(--border-color) !important;
    padding: 6px 16px !important;
    transition: background-color 0.2s ease, border-color 0.2s ease;

    &:hover {
      background-color: var(--item-active-bg) !important;
      border-color: var(--border-color-strong) !important;
    }
  }

  .el-input__inner {
    font-size: 13px !important;
    font-weight: 500 !important;
    color: var(--text-primary) !important;
  }
}

/* ======= 深色主题 - 触发器 ======= */
html[data-theme='dark'] .language-select {
  .el-input__wrapper {
    background-color: var(--item-bg) !important;
    border: 1px solid var(--border-color) !important;
    box-shadow: none !important;

    &:hover {
      background-color: var(--item-hover-bg) !important;
      border-color: var(--border-color-strong) !important;
    }
  }

  .el-input__inner {
    color: var(--text-primary) !important;
  }

  /* 下拉箭头图标颜色 */
  .el-select__caret,
  .el-select__icon {
    color: var(--text-secondary) !important;
  }
}

/* ======= 深色主题 - Popper 弹出下拉菜单 ======= */
.language-dropdown {
  &.el-select__popper,
  &.el-popper {
    background: var(--panel-bg-secondary, #20242e) !important;
    border: 1px solid var(--border-color, #303641) !important;
    box-shadow: 0 12px 32px var(--shadow-color, rgba(0, 0, 0, 0.45)) !important;
  }

  .el-select-dropdown__item {
    color: var(--text-secondary, #b7c0cd) !important;

    &:hover,
    &.is-hovering {
      background-color: var(--item-hover-bg, #222833) !important;
      color: var(--text-primary, #f5f7fa) !important;
    }

    &.is-selected,
    &.selected {
      color: var(--el-color-primary, #0bb7aa) !important;
      font-weight: 600;
    }
  }

  /* popper 箭头 */
  .el-popper__arrow::before {
    background: var(--panel-bg-secondary, #20242e) !important;
    border-color: var(--border-color, #303641) !important;
  }
}

/* 仅在深色主题下激活 Popper 样式 */
html[data-theme='dark'] .language-dropdown {
  &.el-select__popper,
  &.el-popper {
    background: var(--panel-bg-secondary) !important;
    border: 1px solid var(--border-color) !important;
    box-shadow: 0 12px 32px var(--shadow-color) !important;
  }

  .el-select-dropdown__item {
    color: var(--text-secondary) !important;

    &:hover,
    &.is-hovering {
      background-color: var(--item-hover-bg) !important;
      color: var(--text-primary) !important;
    }

    &.is-selected,
    &.selected {
      color: var(--el-color-primary) !important;
    }
  }

  .el-popper__arrow::before {
    background: var(--panel-bg-secondary) !important;
    border-color: var(--border-color) !important;
  }
}
</style>
