<template>
  <nav class="profile-nav-sidebar" aria-label="画像导航">
    <div class="nav-title">画像导航</div>
    <ul class="nav-list">
      <li
        v-for="section in sections"
        :key="section.id"
        class="nav-item"
        :class="{ active: activeId === section.id }"
      >
        <button
          class="nav-link"
          :aria-current="activeId === section.id ? 'true' : undefined"
          @click="$emit('navigate', section.id)"
        >
          <el-icon :size="14" class="nav-icon">
            <component :is="section.icon" />
          </el-icon>
          <span class="nav-label">{{ section.label }}</span>
        </button>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import type { Component } from 'vue'

export interface NavSection {
  id: string
  label: string
  icon: Component
}

defineProps<{
  sections: NavSection[]
  activeId: string
}>()

defineEmits<{
  (e: 'navigate', id: string): void
}>()
</script>

<style scoped lang="scss">
.profile-nav-sidebar {
  // 画像页使用 AppLayout 的主导航作为唯一左侧栏，避免形成双侧栏。
  display: none;
  width: 0;
  flex-shrink: 0;

  &::-webkit-scrollbar {
    display: none;
  }
}

.nav-title {
  font-size: 11px;
  font-weight: 600;
  color: #98a2b3;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 12px 12px;
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  margin: 0;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #667085;
  font-size: 12.5px;
  font-family: inherit;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
  text-align: left;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    background: rgba(37, 99, 235, 0.06);
    color: #2563eb;
  }

  &:focus-visible {
    outline: 2px solid #2563eb;
    outline-offset: -2px;
  }
}

.nav-item.active .nav-link {
  background: rgba(37, 99, 235, 0.1);
  color: #2563eb;
  font-weight: 600;
}

.nav-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

// 响应式：小屏隐藏侧边导航
@media (max-width: 991px) {
  .profile-nav-sidebar {
    display: none;
  }
}
</style>
