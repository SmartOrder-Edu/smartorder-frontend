<template>
  <div class="general-settings">
    <!-- 主题部分 -->
    <div class="setting-group">
      <div class="section-title">{{ t('theme') }}</div>
      <ThemeSelector />
    </div>

    <!-- 语言部分 -->
    <div class="setting-row">
      <span class="section-title no-margin">{{ t('language') }}</span>
      <LanguageSelector />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@/composables/useI18n'
import ThemeSelector from './ThemeSelector.vue'
import LanguageSelector from './LanguageSelector.vue'

const { t } = useI18n()
</script>

<style lang="scss" scoped>
.general-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 16px;
  width: 100%;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
  width: 100%;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;

  &.no-margin {
    margin-bottom: 0;
  }
}
</style>
