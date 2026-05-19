<template>
  <div class="plan-created-card">
    <div class="plan-header">
      <span class="plan-icon">&#x1F4DA;</span>
      <span class="plan-title">学习计划已生成：{{ plan.spaceName }}</span>
    </div>
    <div class="plan-stats">
      <div class="stat-item">
        <span class="stat-value">{{ plan.nodeCount }}</span>
        <span class="stat-label">学习节点</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ plan.taskCount }}</span>
        <span class="stat-label">任务</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">{{ plan.kgNodeCount }}</span>
        <span class="stat-label">知识点</span>
      </div>
    </div>
    <el-button type="primary" @click="goToSpace">
      进入学习空间
    </el-button>
  </div>
</template>

<script setup lang="ts">
import type { PlanSummary } from '@/api/agent'
import { useRouter } from 'vue-router'

const props = defineProps<{
  plan: PlanSummary
}>()

const router = useRouter()

function goToSpace() {
  router.push(`/space/${props.plan.spaceId}`)
}
</script>

<style scoped>
.plan-created-card {
  background: linear-gradient(135deg, #f0f7ff 0%, #e8f4fd 100%);
  border: 1px solid #b3d9ff;
  border-radius: 12px;
  padding: 16px;
  margin-top: 8px;
}

.plan-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.plan-icon {
  font-size: 20px;
}

.plan-title {
  font-weight: 600;
  font-size: 15px;
  color: #1a1a2e;
}

.plan-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 14px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #1677ff;
  display: block;
}

.stat-label {
  font-size: 12px;
  color: #666;
}
</style>
