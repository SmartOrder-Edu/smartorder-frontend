<template>
  <div class="web-search-sources" v-if="references.length > 0">
    <!-- 触发按钮 -->
    <button class="sources-trigger" @click="drawerVisible = true">
      <el-icon :size="13"><Search /></el-icon>
      <span>搜索了 {{ references.length }} 个来源</span>
      <el-icon :size="12" class="trigger-arrow"><ArrowRight /></el-icon>
    </button>

    <!-- 右侧抽屉 -->
    <el-drawer
      v-model="drawerVisible"
      direction="rtl"
      :size="420"
      :with-header="false"
    >
      <template #default>
        <div class="drawer-inner">
          <div class="drawer-header">
            <h3 class="drawer-title">
              <el-icon :size="16"><Search /></el-icon>
              <span>搜索来源（{{ references.length }}）</span>
            </h3>
            <button class="drawer-close" @click="drawerVisible = false">
              <el-icon :size="18"><Close /></el-icon>
            </button>
          </div>
          <div class="drawer-list">
            <a
              v-for="ref in references"
              :key="ref.citationIndex"
              :href="ref.url"
              target="_blank"
              rel="noopener noreferrer"
              class="drawer-source-item"
            >
              <div class="drawer-source-top">
                <img
                  :src="faviconUrl(ref.url)"
                  class="source-favicon"
                  @error="($event.target as HTMLImageElement).style.display = 'none'"
                />
                <span class="source-domain">{{ domain(ref.url) }}</span>
              </div>
              <span class="source-title">{{ ref.title }}</span>
              <span class="source-snippet">{{ ref.snippet }}</span>
            </a>
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Search, ArrowRight, Close } from '@element-plus/icons-vue'

defineProps<{
  references: {
    citationIndex: number
    title: string
    url: string
    snippet: string
  }[]
}>()

const drawerVisible = ref(false)

function domain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function faviconUrl(url: string): string {
  const d = domain(url)
  if (!d || d === url) return ''
  return `https://icon.horse/icon/${d}`
}
</script>

<style scoped>
/* ─── 触发按钮 ──────────────────────────── */
.sources-trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 10px;
  border: 1px solid var(--border-light, #e4e7ed);
  border-radius: 14px;
  background: var(--bg-secondary, #f5f7fa);
  color: var(--text-muted, #909399);
  font-size: 0.6875rem;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
  font-family: inherit;
  line-height: 1.5;
}
.sources-trigger:hover {
  border-color: var(--primary-color, #3b5bdb);
  color: var(--primary-color, #3b5bdb);
}
.trigger-arrow {
  margin-left: -2px;
  transition: transform 0.15s;
}
.sources-trigger:hover .trigger-arrow {
  transform: translateX(1px);
}

/* ─── 抽屉 ──────────────────────────────── */
.drawer-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--border-light, #e4e7ed);
}

.drawer-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-dark, #303133);
}

.drawer-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted, #909399);
  cursor: pointer;
  transition: background 0.15s;
}
.drawer-close:hover {
  background: rgba(0, 0, 0, 0.06);
}

.drawer-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px 16px;
}

/* ─── 抽屉内来源条目 ─────────────────────── */
.drawer-source-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  margin-top: 6px;
  border-radius: 8px;
  text-decoration: none;
  color: inherit;
  transition: background 0.15s;
}
.drawer-source-item:hover {
  background: var(--bg-secondary, #f5f7fa);
}

.drawer-source-top {
  display: flex;
  align-items: center;
  gap: 6px;
}

.drawer-source-top .source-favicon {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  flex-shrink: 0;
}

.drawer-source-top .source-domain {
  font-size: 0.6875rem;
  color: var(--text-muted, #909399);
}

.drawer-source-item .source-title {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-dark, #303133);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.drawer-source-item .source-snippet {
  font-size: 0.75rem;
  color: var(--text-secondary, #606266);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
