<template>
  <div class="settings-sidebar">
    <div
      class="menu-item"
      :class="{ active: activeMenu === 'general' }"
      role="tab"
      :aria-selected="activeMenu === 'general'"
      @click="$emit('select-menu', 'general')"
    >
      <el-icon><Setting /></el-icon>
      <span>{{ t('generalSettings') }}</span>
    </div>
    <div
      class="menu-item"
      :class="{ active: activeMenu === 'account' }"
      role="tab"
      :aria-selected="activeMenu === 'account'"
      @click="$emit('select-menu', 'account')"
    >
      <el-icon><User /></el-icon>
      <span>{{ t('accountSettings') }}</span>
    </div>
    <div
      class="menu-item"
      :class="{ active: activeMenu === 'data' }"
      role="tab"
      :aria-selected="activeMenu === 'data'"
      @click="$emit('select-menu', 'data')"
    >
      <el-icon><Coin /></el-icon>
      <span>{{ t('dataSettings') }}</span>
    </div>
    <div
      class="menu-item"
      :class="{ active: activeMenu === 'terms' }"
      role="tab"
      :aria-selected="activeMenu === 'terms'"
      @click="$emit('select-menu', 'terms')"
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
  background-color: transparent;
  padding: 10px 14px 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-right: none;
  overflow: hidden;

  .menu-item {
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 12px;
    border-radius: 10px;
    cursor: pointer;
    color: var(--text-secondary);
    font-size: 14px;
    background: transparent;
    transition: background-color 0.2s ease, color 0.2s ease;
    position: relative;
    user-select: none;
    box-sizing: border-box;

    .el-icon {
      font-size: 16px;
      color: var(--text-secondary);
      transition: color 0.2s ease;
    }

    span {
      font-weight: 500;
    }

    &:hover {
      background-color: var(--hover-bg);
      color: var(--text-primary);

      .el-icon {
        color: var(--text-primary);
      }
    }

    &.active {
      color: var(--text-primary);
      background-color: var(--hover-bg);
      font-weight: 600;

      .el-icon {
        color: var(--text-primary);
      }

      span {
        font-weight: 600;
      }
    }
  }
}
</style>
