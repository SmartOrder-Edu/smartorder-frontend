<template>
  <div class="web-search-sources" v-if="references.length > 0">
    <div class="sources-header">
      <el-icon :size="14"><Search /></el-icon>
      <span>搜索了 {{ references.length }} 个来源</span>
    </div>
    <div class="sources-scroll">
      <a
        v-for="ref in references"
        :key="ref.citationIndex"
        :href="ref.url"
        target="_blank"
        rel="noopener noreferrer"
        class="source-card"
      >
        <img
          :src="faviconUrl(ref.url)"
          class="source-favicon"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
        <div class="source-info">
          <span class="source-domain">{{ domain(ref.url) }}</span>
          <span class="source-title" :title="ref.title">{{ ref.title }}</span>
        </div>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search } from '@element-plus/icons-vue'

defineProps<{
  references: {
    citationIndex: number
    title: string
    url: string
    snippet: string
  }[]
}>()

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
.web-search-sources {
  margin-bottom: 8px;
}

.sources-header {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 6px;
  font-size: 0.75rem;
  color: var(--text-muted, #909399);
  font-weight: 500;
}

.sources-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  /* 隐藏滚动条但保留滚动能力 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.sources-scroll::-webkit-scrollbar {
  display: none;
}

.source-card {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 180px;
  max-width: 220px;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--bg-secondary, #f5f7fa);
  border: 1px solid var(--border-light, #e4e7ed);
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
  cursor: pointer;
  flex-shrink: 0;
}
.source-card:hover {
  border-color: var(--primary-color, #3b5bdb);
  box-shadow: 0 1px 4px rgba(59, 91, 219, 0.1);
}

.source-favicon {
  width: 18px;
  height: 18px;
  border-radius: 3px;
  flex-shrink: 0;
  margin-top: 1px;
}

.source-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  min-width: 0;
}

.source-domain {
  font-size: 0.6875rem;
  color: var(--text-muted, #909399);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.source-title {
  font-size: 0.75rem;
  color: var(--text-secondary, #606266);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}
</style>
