<template>
  <div
    class="theme-option-card"
    :class="{ active }"
    role="option"
    :aria-selected="active"
    :aria-label="label"
    tabindex="0"
    @click="$emit('select')"
    @keydown.enter.prevent="$emit('select')"
    @keydown.space.prevent="$emit('select')"
  >
    <el-icon class="theme-icon">
      <Sunny v-if="mode === 'light'" />
      <Moon v-else-if="mode === 'dark'" />
      <Monitor v-else />
    </el-icon>
    <span>{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { Sunny, Moon, Monitor } from '@element-plus/icons-vue'

defineProps<{
  active: boolean
  mode: 'light' | 'dark' | 'system'
  label: string
}>()

defineEmits<{
  (e: 'select'): void
}>()
</script>

<style lang="scss" scoped>
.theme-option-card {
  flex: 1;
  height: 68px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  cursor: pointer;
  background-color: var(--panel-bg);
  transition: all 0.2s ease;
  outline: none;

  .theme-icon {
    font-size: 20px;
    color: var(--text-secondary);
    transition: color 0.2s ease;
  }

  span {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-secondary);
    transition: color 0.2s ease;
  }

  &:hover {
    background-color: var(--hover-bg);
    border-color: var(--border-color);

    .theme-icon {
      color: var(--text-primary);
    }
    span {
      color: var(--text-primary);
    }
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px var(--el-color-primary);
  }

  &.active {
    border-color: transparent;
    background-color: var(--hover-bg);

    .theme-icon {
      color: var(--text-primary);
    }

    span {
      color: var(--text-primary);
      font-weight: 600;
    }
  }
}
</style>
