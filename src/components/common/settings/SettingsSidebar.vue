<template>
  <div class="settings-sidebar" role="tablist" :aria-label="t('settings')">
    <div
      class="settings-menu-item"
      :class="{ active: activeMenu === 'general' }"
      role="tab"
      :aria-selected="activeMenu === 'general'"
      tabindex="0"
      @click="$emit('select-menu', 'general')"
      @keydown.enter.prevent="$emit('select-menu', 'general')"
      @keydown.space.prevent="$emit('select-menu', 'general')"
    >
      <el-icon><Setting /></el-icon>
      <span>{{ t('generalSettings') }}</span>
    </div>
    <div
      class="settings-menu-item"
      :class="{ active: activeMenu === 'account' }"
      role="tab"
      :aria-selected="activeMenu === 'account'"
      tabindex="0"
      @click="$emit('select-menu', 'account')"
      @keydown.enter.prevent="$emit('select-menu', 'account')"
      @keydown.space.prevent="$emit('select-menu', 'account')"
    >
      <el-icon><User /></el-icon>
      <span>{{ t('accountSettings') }}</span>
    </div>
    <div
      class="settings-menu-item"
      :class="{ active: activeMenu === 'data' }"
      role="tab"
      :aria-selected="activeMenu === 'data'"
      tabindex="0"
      @click="$emit('select-menu', 'data')"
      @keydown.enter.prevent="$emit('select-menu', 'data')"
      @keydown.space.prevent="$emit('select-menu', 'data')"
    >
      <el-icon><Coin /></el-icon>
      <span>{{ t('dataSettings') }}</span>
    </div>
    <div
      class="settings-menu-item"
      :class="{ active: activeMenu === 'terms' }"
      role="tab"
      :aria-selected="activeMenu === 'terms'"
      tabindex="0"
      @click="$emit('select-menu', 'terms')"
      @keydown.enter.prevent="$emit('select-menu', 'terms')"
      @keydown.space.prevent="$emit('select-menu', 'terms')"
    >
      <el-icon><Document /></el-icon>
      <span>{{ t('serviceTerms') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Setting, User, Coin, Document } from '@element-plus/icons-vue'
import { useI18n } from '@/composables/useI18n'

defineProps<{
  activeMenu: string
}>()

defineEmits<{
  (e: 'select-menu', menu: string): void
}>()

const { t } = useI18n()
</script>

<style lang="scss" scoped>
.settings-sidebar {
  width: 170px;
  padding: 10px 14px 20px;
  background: transparent;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-right: none;
  overflow: hidden;
  box-sizing: border-box;
}

.settings-menu-item {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 14px;
  transition: background-color 0.2s ease, color 0.2s ease;
  position: relative;
  user-select: none;
  box-sizing: border-box;
  outline: none;

  .el-icon {
    font-size: 16px;
    color: var(--text-secondary);
    transition: color 0.2s ease;
  }

  span {
    font-weight: 500;
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px var(--el-color-primary);
  }
}

/* 浅色主题样式 */
html[data-theme='light'] {
  .settings-menu-item {
    color: #5c6370;

    .el-icon {
      color: #5c6370;
    }

    &:hover:not(.active) {
      background-color: rgba(15, 23, 42, 0.04);
      color: #1f2329;

      .el-icon {
        color: #1f2329;
      }
    }

    &.active {
      background-color: rgba(15, 23, 42, 0.07);
      color: #1f2329;
      font-weight: 600;

      .el-icon {
        color: #1f2329;
      }

      span {
        font-weight: 600;
      }
    }
  }
}

/* 深色主题样式 */
html[data-theme='dark'] {
  .settings-menu-item {
    color: #9aa0a6;

    .el-icon {
      color: #9aa0a6;
    }

    &:hover:not(.active) {
      background-color: rgba(255, 255, 255, 0.04);
      color: #f2f3f5;

      .el-icon {
        color: #f2f3f5;
      }
    }

    &.active {
      background-color: rgba(255, 255, 255, 0.08);
      color: #f2f3f5;
      font-weight: 600;

      .el-icon {
        color: #f2f3f5;
      }

      span {
        font-weight: 600;
      }
    }
  }
}
</style>
