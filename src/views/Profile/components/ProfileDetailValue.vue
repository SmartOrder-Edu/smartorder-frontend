<template>
  <div v-if="isObject(value)" class="detail-object">
    <div v-for="[key, item] in objectEntries" :key="key" class="detail-row">
      <span class="detail-label">{{ labelOf(key) }}</span>
      <ProfileDetailValue :value="item" :depth="depth + 1" />
    </div>
  </div>
  <div v-else-if="Array.isArray(value) && arrayContainsObject" class="detail-array">
    <ProfileDetailValue v-for="(item, index) in value" :key="index" :value="item" :depth="depth + 1" />
  </div>
  <div v-else-if="Array.isArray(value)" class="detail-tags">
    <span v-for="item in value" :key="String(item)" class="detail-tag">{{ formatValue(item) }}</span>
  </div>
  <span v-else class="detail-value">{{ formatValue(value) }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'ProfileDetailValue' })

const props = withDefaults(defineProps<{
  value: unknown
  depth?: number
}>(), { depth: 0 })

const labels: Record<string, string> = {
  education: '教育背景', educationLevel: '学历', grade: '年级', majorName: '专业',
  currentLevelDetail: '当前水平', selfDescription: '自我描述', priorExperience: '既往经验',
  completedSubjects: '已学课程', programmingLanguages: '编程语言', learningConstraints: '学习约束',
  weeklyAvailableMinutes: '每周可学习时间（分钟）', preferredStudyPeriods: '偏好学习时段',
  maxSessionMinutes: '单次最长学习时长（分钟）', deviceTypes: '设备', networkCondition: '网络条件',
  profileSummary: '画像摘要', lastUpdateReason: '最近更新原因', dimensionMetadata: '维度更新信息',
  confidence: '置信度', completeness: '完整度', sourceTypes: '数据来源', lastUpdatedAt: '最近更新时间',
  updateReason: '更新原因', goals: '目标列表', targetLevel: '目标水平', startAt: '开始时间',
  measurableCriteria: '衡量条件', strengthSummary: '优势说明', improvementFocus: '改进方向',
  rootCauseHypotheses: '根因假设', affectedSubjectIds: '影响学科', affectedKnowledgePointIds: '影响知识点',
  persistence: '持续性', occurrenceStatistics: '出现统计', subjectOverrides: '学科偏好覆盖',
  calibrationStatistics: '校准统计', recommendedSupport: '推荐支持', knowledgeMastery: '知识掌握',
  learningBehavior: '学习行为', currentLearningState: '当前学习状态', nextAction: '下一步行动',
  blockingIssues: '阻塞问题', currentTask: '当前任务', behaviorPatterns: '行为模式'
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const objectEntries = computed(() => {
  if (!isObject(props.value)) return []
  return Object.entries(props.value).filter(([, value]) => value !== null && value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0))
})

const arrayContainsObject = computed(() => Array.isArray(props.value) && props.value.some(isObject))

const labelOf = (key: string) => labels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, char => char.toUpperCase())
const formatValue = (value: unknown) => typeof value === 'boolean' ? (value ? '是' : '否') : String(value)
</script>

<style scoped>
.detail-object { display: grid; gap: 10px; width: 100%; }
.detail-row { display: grid; grid-template-columns: minmax(130px, 180px) 1fr; gap: 12px; padding-top: 10px; border-top: 1px solid var(--border-light); }
.detail-label { color: var(--text-secondary); font-size: 0.8125rem; }
.detail-value { color: var(--text-dark); font-size: 0.875rem; overflow-wrap: anywhere; }
.detail-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.detail-tag { padding: 4px 8px; border-radius: 999px; background: var(--bg-light); color: var(--text-dark); font-size: 0.8125rem; }
.detail-array { display: grid; gap: 10px; }
@media (max-width: 640px) { .detail-row { grid-template-columns: 1fr; gap: 4px; } }
</style>
