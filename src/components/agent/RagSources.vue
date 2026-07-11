<template>
  <div class="rag-sources" v-if="visibleChunks.length">
    <button class="sources-trigger" @click="drawerVisible = true">
      <el-icon :size="13"><Collection /></el-icon>
      <span>引用了 {{ visibleChunks.length }} 条知识库片段</span>
      <span class="mode-badge">{{ modeLabel }}</span>
      <el-icon :size="12" class="trigger-arrow"><ArrowRight /></el-icon>
    </button>

    <el-drawer
      v-model="drawerVisible"
      direction="rtl"
      :size="460"
      :with-header="false"
    >
      <template #default>
        <div class="drawer-inner">
          <div class="drawer-header">
            <h3 class="drawer-title">
              <el-icon :size="16"><Collection /></el-icon>
              <span>知识库引用（{{ visibleChunks.length }}）</span>
            </h3>
            <button class="drawer-close" @click="drawerVisible = false">
              <el-icon :size="18"><Close /></el-icon>
            </button>
          </div>

          <div class="drawer-meta">
            <span>检索模式：{{ modeLabel }}</span>
            <span v-if="sources.degraded" class="degraded">已降级</span>
          </div>

          <div class="drawer-list">
            <article
              v-for="(chunk, index) in visibleChunks"
              :key="chunk.vectorId || chunk.chunkId || index"
              class="source-item"
            >
              <div class="source-head">
                <span class="source-index">{{ index + 1 }}</span>
                <div class="source-title-wrap">
                  <h4 class="source-title">{{ chunkTitle(chunk, index) }}</h4>
                  <div class="source-path" v-if="chunk.titlePath">{{ chunk.titlePath }}</div>
                </div>
              </div>

              <div class="source-tags">
                <span v-if="chunk.source" class="source-tag">{{ sourceLabel(chunk.source) }}</span>
                <span v-if="chunk.pageNumber" class="source-tag">第 {{ chunk.pageNumber }} 页</span>
                <span v-if="typeof chunk.score === 'number'" class="source-tag">
                  相关度 {{ formatScore(chunk.score) }}
                </span>
              </div>

              <p class="source-content">{{ contentPreview(chunk.content) }}</p>
            </article>
          </div>
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, Close, Collection } from '@element-plus/icons-vue'
import type { RagChunk, RagSourcePayload } from '@/composables/useAgentChat'

const props = defineProps<{
  sources: RagSourcePayload
}>()

const drawerVisible = ref(false)

const visibleChunks = computed(() => (props.sources?.chunks || []).filter(Boolean))

const modeLabel = computed(() => {
  const mode = props.sources?.usedRetrievalMode || 'unknown'
  const labels: Record<string, string> = {
    auto: '自动',
    simple: '向量检索',
    medium: '混合检索',
    complex: '图谱检索',
    unknown: '检索',
  }
  return labels[mode] || mode
})

function chunkTitle(chunk: RagChunk, index: number): string {
  return chunk.sectionTitle || chunk.titlePath || `检索片段 ${index + 1}`
}

function sourceLabel(source: string): string {
  const labels: Record<string, string> = {
    vector: '向量',
    hybrid: '混合',
    graph: '图谱',
  }
  return labels[source] || source
}

function formatScore(score: number): string {
  if (!Number.isFinite(score)) return '0.000'
  return score.toFixed(3)
}

function contentPreview(content?: string): string {
  if (!content?.trim()) return '该片段暂无可展示内容'
  const normalized = content.replace(/\s+/g, ' ').trim()
  return normalized.length > 360 ? `${normalized.slice(0, 360)}...` : normalized
}
</script>

<style scoped>
.rag-sources {
  margin-bottom: 8px;
}

.sources-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border: 1px solid #d7e7df;
  border-radius: 14px;
  background: #f3fbf7;
  color: #247052;
  font-size: 0.6875rem;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
  font-family: inherit;
  line-height: 1.5;
}

.sources-trigger:hover {
  border-color: #10b981;
  background: #ecfdf5;
  color: #047857;
}

.mode-badge {
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.trigger-arrow {
  margin-left: -2px;
  transition: transform 0.15s;
}

.sources-trigger:hover .trigger-arrow {
  transform: translateX(1px);
}

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

.drawer-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-bottom: 1px solid #eef2f7;
  color: #64748b;
  font-size: 0.75rem;
}

.degraded {
  color: #b45309;
}

.drawer-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 16px 16px;
}

.source-item {
  padding: 12px;
  margin-top: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.source-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.source-index {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #ecfdf5;
  color: #047857;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.source-title-wrap {
  min-width: 0;
  flex: 1;
}

.source-title {
  margin: 0;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: #1f2937;
}

.source-path {
  margin-top: 2px;
  color: #94a3b8;
  font-size: 0.6875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.source-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.source-tag {
  padding: 2px 6px;
  border-radius: 4px;
  background: #f8fafc;
  color: #64748b;
  font-size: 0.6875rem;
}

.source-content {
  margin: 8px 0 0;
  color: #475569;
  font-size: 0.75rem;
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>
