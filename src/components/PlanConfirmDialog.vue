<template>
  <el-dialog
    v-model="agentStore.planDialogVisible"
    title="学习规划确认"
    width="620px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
  >
    <div class="plan-content" v-if="agentStore.currentPlan">
      <!-- 基本信息 -->
      <div class="plan-header">
        <h3>{{ agentStore.currentPlan.spaceName }}</h3>
        <el-tag :type="typeTagType(agentStore.currentPlan.type)">
          {{ agentStore.currentPlan.type }}
        </el-tag>
      </div>

      <p class="plan-desc">{{ agentStore.currentPlan.description }}</p>

      <!-- 学习目标 -->
      <div class="plan-section" v-if="agentStore.currentPlan.goals?.length">
        <h4>学习目标</h4>
        <ul>
          <li v-for="(goal, i) in agentStore.currentPlan.goals" :key="i">{{ goal }}</li>
        </ul>
      </div>

      <!-- 学习阶段 -->
      <div class="plan-section" v-if="agentStore.currentPlan.phases?.length">
        <h4>学习阶段 ({{ agentStore.currentPlan.phases.length }} 个)</h4>
        <div
          v-for="phase in agentStore.currentPlan.phases"
          :key="phase.phaseIndex"
          class="phase-item"
        >
          <div class="phase-header">
            <span class="phase-index">{{ phase.phaseIndex }}</span>
            <strong>{{ phase.phaseName }}</strong>
            <span class="phase-weeks">{{ phase.weeks }} 周</span>
          </div>
          <div class="phase-kps">
            <el-tag
              v-for="kp in phase.knowledgePoints"
              :key="kp"
              size="small"
              type="info"
            >
              {{ kp }}
            </el-tag>
          </div>
          <div class="phase-resources" v-if="phase.resources?.length">
            <span
              v-for="r in phase.resources"
              :key="r.title"
              class="resource-item"
            >
              {{ r.resourceType }}: {{ r.title }}
            </span>
          </div>
        </div>
      </div>

      <!-- 知识图谱 -->
      <div class="plan-section" v-if="agentStore.currentPlan.knowledgeGraph?.nodes?.length">
        <h4>知识图谱 ({{ agentStore.currentPlan.knowledgeGraph.nodes.length }} 个知识点)</h4>
        <div class="kg-nodes">
          <el-tag
            v-for="node in agentStore.currentPlan.knowledgeGraph.nodes"
            :key="node.name"
            :type="importanceTag(node.importance)"
          >
            {{ node.name }}
          </el-tag>
        </div>
      </div>

      <!-- 每日安排 -->
      <div class="plan-section" v-if="agentStore.currentPlan.dailyPlan">
        <h4>每日学习安排</h4>
        <p v-if="agentStore.currentPlan.dailyPlan.morning">
          <strong>上午：</strong>{{ agentStore.currentPlan.dailyPlan.morning }}
        </p>
        <p v-if="agentStore.currentPlan.dailyPlan.evening">
          <strong>下午/晚间：</strong>{{ agentStore.currentPlan.dailyPlan.evening }}
        </p>
      </div>
    </div>

    <template #footer>
      <el-button @click="$emit('cancel')">取消</el-button>
      <el-button
        type="primary"
        :loading="agentStore.planConfirmLoading"
        @click="$emit('confirm', agentStore.currentDraftId)"
      >
        确认并创建学习空间
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { useAgentStore } from '@/stores/agent'

defineEmits<{
  confirm: [draftId: string]
  cancel: []
}>()

const agentStore = useAgentStore()

function typeTagType(type: string): 'success' | 'warning' | 'info' | 'danger' | '' {
  switch (type) {
    case 'course': return 'info'
    case 'exam': return 'warning'
    case 'project': return 'success'
    case 'career': return ''
    case 'competition': return 'danger'
    default: return 'info'
  }
}

function importanceTag(imp: number): 'success' | 'warning' | 'danger' | 'info' | '' {
  if (imp >= 5) return 'danger'
  if (imp >= 4) return 'warning'
  if (imp >= 3) return 'success'
  return 'info'
}
</script>

<style scoped>
.plan-content {
  max-height: 480px;
  overflow-y: auto;
}
.plan-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.plan-header h3 {
  margin: 0;
}
.plan-desc {
  color: var(--el-text-color-secondary);
  margin-bottom: 16px;
}
.plan-section {
  margin-bottom: 16px;
}
.plan-section h4 {
  margin-bottom: 8px;
  font-size: 14px;
}
.phase-item {
  padding: 10px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  margin-bottom: 8px;
}
.phase-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.phase-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: #fff;
  font-size: 12px;
}
.phase-weeks {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  margin-left: auto;
}
.phase-kps {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 4px;
}
.phase-resources {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.resource-item {
  margin-right: 12px;
}
.kg-nodes {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
