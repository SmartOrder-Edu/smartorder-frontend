<template>
  <AppLayout>
    <div class="study-page">
      <!-- 顶栏 -->
      <header class="study-topbar">
        <div class="topbar-left">
          <button class="back-btn" @click="$router.back()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <polyline points="15,18 9,12 15,6"/>
            </svg>
            返回
          </button>
          <div class="breadcrumb">
            <span class="crumb-space" v-if="spaceName">{{ spaceName }}</span>
            <svg v-if="spaceName" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11">
              <polyline points="9,18 15,12 9,6"/>
            </svg>
            <span class="crumb-current">学习会话</span>
            <span class="mode-tag" :class="stepStore.mode">{{ modeLabel }}</span>
          </div>
        </div>
        <div class="topbar-right">
          <div class="task-title" v-if="stepStore.taskId">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            <span>{{ stepStore.taskId }}</span>
          </div>
        </div>
      </header>

      <!-- 主体四区 -->
      <div class="study-body" v-loading="stepStore.loading">
        <!-- 左：学习脚本 -->
        <div class="region region-script">
          <LearningScript @jump="onJump" />
        </div>

        <!-- 中：Agent 教学画布 -->
        <div class="region region-canvas">
          <StudyCanvas />
        </div>

        <!-- 右：Agent 陪伴 -->
        <div class="region region-agent">
          <StudyAgentPanel />
        </div>
      </div>

      <!-- 底：进度反馈 -->
      <StudyProgressFooter />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import LearningScript from '@/components/study/LearningScript.vue'
import StudyCanvas from '@/components/study/StudyCanvas.vue'
import StudyAgentPanel from '@/components/StudyAgentPanel.vue'
import StudyProgressFooter from '@/components/study/StudyProgressFooter.vue'
import { useTaskStepStore } from '@/stores/taskStep'
import { useSpaceDashboardStore } from '@/stores/spaceDashboard'
import type { StudyMode } from '@/types/study'

const route = useRoute()
const stepStore = useTaskStepStore()
const dashStore = useSpaceDashboardStore()

const spaceName = computed(() => dashStore.dashboard?.space?.name || '')

const modeLabel = computed(() => {
  const m: Record<StudyMode, string> = {
    learn: '学习模式',
    review: '复习模式',
    assessment: '测评模式',
    breakthrough: '专项突破',
    preview: '预览模式',
  }
  return m[stepStore.mode] || '学习模式'
})

function onJump(index: number) {
  stepStore.goToStep(index)
  // goToStep 内部已调用 startTeaching()，确保教学流重启
}

onMounted(async () => {
  const id = String(route.params.taskId || '')
  if (!id) return
  const mode = (route.query.mode as StudyMode) || 'learn'
  const spaceId = route.query.spaceId as string | undefined
  // 若带 spaceId，先拉空间信息用于面包屑
  if (spaceId) {
    dashStore.fetchDashboard(spaceId).catch(() => {})
  }
  await stepStore.fetchSteps(id, { mode, spaceId })
  // 启动 Agent 教学流
  stepStore.startTeaching()
})

onUnmounted(() => {
  stepStore.reset()
})
</script>

<style scoped lang="scss">
.study-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 0px);
  min-height: 600px;
  background: linear-gradient(180deg, #f8fafc, #eef2f7);
}

.study-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  flex-shrink: 0;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
  color: #475569;
  font-size: 13px;
  cursor: pointer;
  &:hover { border-color: #0bb7aa; color: #0bb7aa; }
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #64748b;

  .crumb-space { color: #475569; }
  .crumb-current { color: #0f172a; font-weight: 500; }

  .mode-tag {
    margin-left: 6px;
    padding: 2px 9px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 500;
    background: rgba(11, 183, 170, 0.12);
    color: #0bb7aa;

    &.review { background: rgba(100, 116, 139, 0.12); color: #64748b; }
    &.assessment { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
    &.breakthrough { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
    &.preview { background: rgba(14, 165, 233, 0.12); color: #0ea5e9; }
  }
}

.topbar-right {
  .task-title {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #94a3b8;
    svg { color: #0bb7aa; }
  }
}

.study-body {
  flex: 1;
  display: grid;
  grid-template-columns: 260px 1fr 320px;
  min-height: 0;
  overflow: hidden;
}

.region {
  min-height: 0;
  display: flex;
  flex-direction: column;

  &.region-script { overflow: hidden; }
  &.region-canvas { overflow: hidden; }
  &.region-agent { overflow: hidden; }
}

@media (max-width: 1280px) {
  .study-body { grid-template-columns: 220px 1fr 290px; }
}

@media (max-width: 1024px) {
  .study-body {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
    overflow-y: auto;
  }
  .region-script { max-height: 240px; }
  .region-agent { max-height: 380px; }
}
</style>
